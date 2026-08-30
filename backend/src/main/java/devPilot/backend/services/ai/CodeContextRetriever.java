package devPilot.backend.services.ai;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CodeContextRetriever {

    private static final String NO_MATCHES
            = "(no matching code chunks found)";

    private final VectorStore vectorStore;
    private final CitationMapper citationMapper;

    public RetrievedContext retrieve(
            UUID repositoryId,
            String question) {

        var filter = new FilterExpressionBuilder()
                .eq(
                        RagSettings.METADATA_REPO_ID,
                        repositoryId.toString())
                .build();

        /*
         * Use several search formulations.
         *
         * A user question such as:
         * "Where is authentication implemented?"
         *
         * may be semantically closer to HTML login pages than
         * the actual backend implementation.
         */
        List<String> queries = List.of(
                question,
                question + " implementation backend code",
                question + " function class controller service logic",
                question + " authentication login credentials verification"
        );

        Map<String, Document> uniqueDocuments = new LinkedHashMap<>();

        for (String query : queries) {

            var search = SearchRequest.builder()
                    .query(query)
                    .topK(RagSettings.TOP_K_CHUNKS)
                    .filterExpression(filter)
                    .build();

            var documents = vectorStore.similaritySearch(search);

            for (Document document : documents) {

                String filePath = String.valueOf(
                        document.getMetadata().get("filePath"));

                String chunkIndex = String.valueOf(
                        document.getMetadata().get("chunkIndex"));

                String key = filePath + ":" + chunkIndex;

                uniqueDocuments.putIfAbsent(key, document);
            }
        }

        List<Document> documents
                = uniqueDocuments.values()
                        .stream()
                        .limit(30)
                        .toList();

        var citations = documents.stream()
                .map(citationMapper::fromDocument)
                .distinct()
                .toList();

        String contextText = documents.stream()
                .map(this::formatDocument)
                .collect(java.util.stream.Collectors.joining(
                        "\n\n=========================\n\n"));

        if (contextText.isBlank()) {
            contextText = NO_MATCHES;
        }

        return new RetrievedContext(
                citations,
                contextText);
    }

    private String formatDocument(Document document) {

        var metadata = document.getMetadata();

        String filePath
                = stringValue(metadata.get("filePath"));

        String language
                = stringValue(metadata.get("language"));

        String chunkIndex
                = stringValue(metadata.get("chunkIndex"));

        String startLine
                = stringValue(metadata.get("startLine"));

        String endLine
                = stringValue(metadata.get("endLine"));

        StringBuilder result = new StringBuilder();

        result.append("FILE: ")
                .append(filePath != null
                        ? filePath
                        : "unknown")
                .append("\n");

        if (language != null) {
            result.append("LANGUAGE: ")
                    .append(language)
                    .append("\n");
        }

        if (startLine != null && endLine != null) {
            result.append("LINES: ")
                    .append(startLine)
                    .append("-")
                    .append(endLine)
                    .append("\n");
        }

        if (chunkIndex != null) {
            result.append("CHUNK: ")
                    .append(chunkIndex)
                    .append("\n");
        }

        result.append("\nCODE:\n")
                .append(document.getText());

        return result.toString();
    }

    private static String stringValue(Object value) {
        return value == null
                ? null
                : String.valueOf(value);
    }
}
