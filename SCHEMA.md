## Protocol Description

WhisperBox is a privacy-preserving survey protocol based on Waku. Surveys are widely used for research and collecting feedback, but they are typically hosted on centralized platforms that require trust. Privacy is essential for surveys to collect reliable data, especially on controversial subjects. The ephemeral nature of Waku helps achieve this privacy.

### Security Model
The primary goal of the protocol is to preserve the privacy of respondents from external observers. Only the researcher (survey creator) must be able to decrypt the responses. The researcher will see the responses in clear text, which aligns with our security assumptions. However, the researcher must not be able to infer additional privacy-related data from the responses, such as the IP address or location of the respondent.

In research, some responses are typically discarded (e.g., outliers). The protocol does not enforce consideration of all responses. Confirmation of receipt is possible, but confirmation of consideration is not required. The researcher is trusted to tally the results reasonably. They may optionally publish aggregated survey results in the same Waku topic but are not required to prove how responses were handled.

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

### Encryption Modes
There are three security modes:
1. **Unencrypted**: All data is transparent. Generally not recommended but may work for non-sensitive use cases. Respondents should avoid including personally identifiable data.
2. **Encrypted responses**: The survey is public, but responses are encrypted using the researcher's public key. Only the researcher can decrypt responses.
3. **Encrypted and authenticated responses**: In addition to encryption, respondents include a proof of eligibility in their responses. This allows the researcher to limit participants, e.g., requiring a wallet in the response. Advanced setups may use zero-knowledge proofs of membership or signatures proving ownership of a token (NFT, Ordinal).

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

### Future Work
- Improve survey discoverability via Waku announcements or external websites.
- Add spam protection using RLN, in addition to optional respondent whitelisting, ensuring that each eligible respondent can respond at most once (related: Semaphore protocol).
- Enable respondents to prove they have participated without revealing extra information.
- Provide a mechanism for respondents to verify that their response has been considered, while recognizing that researchers may discard responses as part of normal data processing (e.g., outliers, spam, incomplete responses).

### Related Work
- **Qaku** - Q&A over Waku: [https://qaku.app/](https://qaku.app/)
- **Megaphone** - Forms-based platform: [https://www.megaphone.xyz/forms](https://www.megaphone.xyz/forms) (requires login via centralized email provider, making it unsuitable for privacy-focused use cases)
