package devPilot.backend.services.indexing;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import devPilot.backend.services.ai.RagSettings;

@Component
public class CodeChunker {

    private final TokenTextSplitter splitter;
    private final CodeFileFilter fileFilter;

    public CodeChunker(
            @Value("${app.indexing.chunk-size:800}") int chunkSize,
            CodeFileFilter fileFilter) {

        // Spring AI splits by tokens.
        // Roughly 4 characters per token is a reasonable default for code.
        int chunkTokens = Math.max(50, chunkSize / 4);

        this.splitter = TokenTextSplitter.builder()
                .withChunkSize(chunkTokens)
                .build();

        this.fileFilter = fileFilter;
    }

    public List<Document> chunkFile(
            String repoId,
            String filePath,
            String content) {

        if (content == null || content.isBlank()) {
            return List.of();
        }

        String language = fileFilter.detectLanguage(filePath);

        String header = "// File: " + filePath + "\n";

        Document source = new Document(
                header + content,
                baseMetadata(repoId, filePath, language));

        List<Document> split = splitter.apply(List.of(source));

        return IntStream.range(0, split.size())
                .mapToObj(i -> createChunk(
                split.get(i),
                repoId,
                filePath,
                language,
                content,
                i))
                .toList();
    }

    private Document createChunk(
            Document chunk,
            String repoId,
            String filePath,
            String language,
            String originalContent,
            int chunkIndex) {

        Map<String, Object> metadata
                = new HashMap<>(chunk.getMetadata());

        metadata.put(
                RagSettings.METADATA_REPO_ID,
                repoId);

        metadata.put(
                "filePath",
                filePath);

        metadata.put(
                "language",
                language);

        metadata.put(
                "chunkIndex",
                chunkIndex);

        /*
         * Determine the approximate source line range
         * represented by this chunk.
         */
        LineRange lineRange
                = findLineRange(
                        chunk.getText(),
                        originalContent);

        if (lineRange != null) {
            metadata.put(
                    "startLine",
                    lineRange.startLine());

            metadata.put(
                    "endLine",
                    lineRange.endLine());
        }

        return new Document(
                chunk.getText(),
                metadata);
    }

    private static Map<String, Object> baseMetadata(
            String repoId,
            String filePath,
            String language) {

        Map<String, Object> metadata
                = new HashMap<>();

        metadata.put(
                RagSettings.METADATA_REPO_ID,
                repoId);

        metadata.put(
                "filePath",
                filePath);

        metadata.put(
                "language",
                language);

        return metadata;
    }

    private static LineRange findLineRange(
            String chunkText,
            String originalContent) {

        if (chunkText == null
                || chunkText.isBlank()
                || originalContent == null
                || originalContent.isBlank()) {

            return null;
        }

        /*
         * TokenTextSplitter receives a document beginning
         * with "// File: <path>".
         *
         * Remove that artificial header before locating
         * the chunk inside the original source file.
         */
        String sourceText = chunkText;

        int headerEnd
                = sourceText.indexOf('\n');

        if (headerEnd >= 0
                && sourceText.startsWith("// File:")) {

            sourceText
                    = sourceText.substring(
                            headerEnd + 1);
        }

        if (sourceText.isBlank()) {
            return null;
        }

        int position
                = originalContent.indexOf(sourceText);

        if (position < 0) {
            /*
             * The exact chunk could not be located.
             * Do not invent line numbers.
             */
            return null;
        }

        int startLine = 1;

        for (int i = 0; i < position; i++) {
            if (originalContent.charAt(i) == '\n') {
                startLine++;
            }
        }

        int endPosition
                = position + sourceText.length();

        int endLine = startLine;

        for (int i = position;
                i < endPosition && i < originalContent.length();
                i++) {

            if (originalContent.charAt(i) == '\n') {
                endLine++;
            }
        }

        return new LineRange(
                startLine,
                endLine);
    }

    private record LineRange(
            int startLine,
            int endLine) {

    }
}
