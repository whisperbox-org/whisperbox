## Protocol Description

WhisperBox is a privacy-preserving survey protocol based on Waku. Forms are widely used for research and collecting feedback, but they are typically hosted on centralized platforms that require trust. Privacy is essential for surveys (aka forms) to collect reliable data, especially on controversial subjects. The ephemeral nature of Waku helps achieve this privacy.

### Security Model
The primary goal of the protocol is to preserve the privacy of respondents from external observers. Only the researcher (form creator) must be able to decrypt the responses. The researcher will see the responses in clear text, which aligns with our security assumptions. However, the researcher must not be able to infer additional privacy-related data from the responses, such as the IP address or location of the respondent.

In research, some responses are typically discarded (e.g., outliers). The protocol does not enforce consideration of all responses. Confirmation of receipt is possible, but confirmation of consideration is not required. The researcher is trusted to tally the results reasonably. They may optionally publish aggregated form results in the same Waku topic but are not required to prove how responses were handled.

### Roles in the protocol:
- **Researcher**: Creates and distributes forms, collects responses, and optionally publishes results.
- **Respondent**: Receives form notifications, submits encrypted responses.

### Protocol Flow:
1. The Researcher posts a `Form` message over Waku.
2. The Respondent:
   - Decodes the `Form` message.
   - Generates a `FormResponse`, encrypting responses with the form's public key.
   - Posts the `FormResponse` to the Waku topic.
3. The Researcher collects and aggregates responses.
4. *(Optional)* The Researcher posts a `FormClose` message to close the form and indicate a deadline.
5. *(Optional)* The Researcher posts a `FormResults` message with aggregated results.

### Encryption Modes
There are three security modes:
1. **Unencrypted**: All data is transparent. Generally not recommended but may work for non-sensitive use cases. Respondents should avoid including personally identifiable data.
2. **Encrypted responses**: The form is public, but responses are encrypted using the researcher's public key. Only the researcher can decrypt responses.
3. **Encrypted and authenticated responses**: In addition to encryption, respondents include a proof of eligibility in their responses. This allows the researcher to limit participants, e.g., requiring a wallet in the response. Advanced setups may use zero-knowledge proofs of membership or signatures proving ownership of a token (NFT, Ordinal).

### Protocol Schema

```proto
syntax = "proto3";

message Question {
    enum Type {
        TEXT = 0;
        TEXT_AREA = 1;
        SINGLE_CHOICE = 2;
        MULTIPLE_CHOICE = 3;
    }
    string id = 1;
    Type type = 2;
    string text = 3;
    bool required = 4;
    repeated string options = 5;  // for choice-based questions
}

message Form {
    message Whitelist {
        enum Type {
            NFT = 0;
            ADDRESSES = 1;
            NONE = 2;
        }
        Type type = 1;
        string value = 2;
    }
    string id = 1;
    optional string title = 2;
    optional string description = 3;
    optional string creator = 4;
    uint64 created_at = 5;
    optional uint64 expires_at = 6;
    repeated Question questions = 7;
    Whitelist whitelist = 8;
    repeated FormResponse responses = 9;
}

message FormResponse {
    message Answer {
        string question_id = 1;
        oneof value {
            string text = 2;
            uint32 option = 3;
            repeated uint32 options = 4;
        }
    }
    string id = 1;  // response ID
    string form_id = 2;   // form ID that this response relates to
    string respondent = 3;
    optional string respondent_ENS = 4;
    uint64 submitted_at = 5;
    repeated Answer answers = 6;
}

message FormResponseEncrypted {
    string form_id = 1;
    bytes response_encrypted = 2;
    optional string encryption_scheme = 3;  // Optional: specify encryption method
}

message FormClose {
    string form_id = 1;
    uint64 expires_at = 2;
}

message FormResults {
    string form_id = 1;
    bytes aggregated_results = 2;
}
```

### Future Work
- Improve form discoverability via Waku announcements or external websites.
- Add spam protection using RLN, in addition to optional respondent whitelisting, ensuring that each eligible respondent can respond at most once (related: Semaphore protocol).
- Enable respondents to prove they have participated without revealing extra information.
- Provide a mechanism for respondents to verify that their response has been considered, while recognizing that researchers may discard responses as part of normal data processing (e.g., outliers, spam, incomplete responses).

### Related Work
- **Qaku** - Q&A over Waku: [https://qaku.app/](https://qaku.app/)
- **Megaphone** - Forms-based platform: [https://www.megaphone.xyz/forms](https://www.megaphone.xyz/forms) (requires login via centralized email provider, making it unsuitable for privacy-focused use cases)
