## Protocol Description

This protocol facilitates privacy-preserving surveys using Waku.

### Roles in the protocol:
- **Researcher**: Creates and distributes surveys, collects responses, and optionally publishes results.
- **Respondent**: Receives survey notifications, submits encrypted responses.

### Protocol Flow:
1. The Researcher posts a `SurveyCreate` message over Waku.
2. The Respondent:
   - Decodes the `SurveyCreate` message.
   - Generates a `SurveyResponse`, encrypting responses with the survey's public key.
   - Posts the `SurveyResponse` to the Waku topic.
3. The Researcher collects and aggregates responses.
4. *(Optional)* The Researcher posts a `SurveyClose` message to close the survey and indicate a deadline.
5. *(Optional)* The Researcher posts a `SurveyResults` message with aggregated results.

---

```proto
syntax = "proto3";

message SurveyCreate {
    string survey_id = 1;
    repeated FormQuestion survey_questions = 2;
    bytes survey_pub_key = 3;
    optional string survey_eligibility_requirements = 4;
    optional uint64 survey_deadline = 5;
}

message FormQuestion {
    enum SurveyQuestionType {
        TEXT = 0;
        SINGLE_CHOICE = 1;
        MULTI_CHOICE = 2;
    }
    SurveyQuestionType question_type = 1;
    string survey_question = 2;
    repeated string survey_options = 3; // Optional
}

message SurveyResponse {
    string response_id = 1;
    bytes encrypted_survey_response_payload = 2;
}

message SurveyResponsePayload {
    string survey_id = 1;
    bytes survey_response = 2;
    optional bytes survey_eligibility_proof = 3; // ZKP, signature, etc.
}

message SurveyClose {
    string survey_id = 1;
    uint64 timestamp = 2;
}

message SurveyResults {
    string survey_id = 1;
    bytes aggregated_results = 2;
}
```
