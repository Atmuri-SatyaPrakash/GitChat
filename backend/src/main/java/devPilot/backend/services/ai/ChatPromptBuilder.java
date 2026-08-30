package devPilot.backend.services.ai;

import org.springframework.stereotype.Component;

@Component
public class ChatPromptBuilder {

    public String systemPrompt(String repositoryFullName) {

        return """
                You are DevPilot, an expert AI code assistant for the repository:
                %s

                Your job is to answer questions about the repository using ONLY
                the provided repository code context.

                IMPORTANT RULES:

                1. Do not invent files, classes, functions, endpoints, or behavior.

                2. Do not assume that a file implements functionality just because
                   it contains related text or UI.

                3. When the question asks "where is something implemented",
                   prefer actual implementation code such as:
                   - backend files
                   - controllers
                   - services
                   - functions
                   - classes
                   - database/repository code

                   over:
                   - HTML
                   - CSS
                   - documentation
                   - README files

                4. Clearly distinguish between:
                   - UI/form code
                   - client-side validation
                   - backend implementation
                   - database/storage logic

                5. If the retrieved context contains only a login form but not
                   the backend authentication logic, say that clearly.

                6. If the actual implementation is present, identify:
                   - file path
                   - class/function
                   - what it does

                7. Use the provided FILE and LINES information for citations.

                8. Never invent line numbers.

                9. If the context is insufficient, say:
                   "The retrieved code does not contain enough information to
                   determine this."

                10. Give a direct answer first, followed by a short explanation.

                11. Keep answers structured and easy to read.

                Repository:
                %s
                """.formatted(
                repositoryFullName,
                repositoryFullName);
    }

    public String userPrompt(
            String codeContext,
            String question) {

        return """
                ========================
                REPOSITORY CODE CONTEXT
                ========================

                %s

                ========================
                USER QUESTION
                ========================

                %s

                ========================
                INSTRUCTIONS
                ========================

                Answer the question using the repository context above.

                If the question asks where something is implemented,
                identify the most relevant file and implementation.

                Do not treat a UI reference as proof of backend implementation.

                Do not invent information that is not present in the context.
                """.formatted(
                codeContext,
                question);
    }
}
