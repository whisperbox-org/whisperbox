# WhisperBox - Development TODOs

This document outlines areas in the codebase that need to be implemented, refactored, or improved to replace sample/dummy/hardcoded content with real implementations.

## Web3 & Blockchain Integration

### NFT Integration
- [x] Replace mock NFT ownership check with actual blockchain queries
  - [x] Implement ERC-721/ERC-1155 interface for checking token ownership
  - [x] Create a utility function to query multiple contracts if needed
- [x] Implement proper NFT contract validation
- [x] Update `NFTGate.tsx` component to use real ownership verification
  - [x] Remove simulated network delays and verification states
  - [x] Implement proper loading states based on actual blockchain queries
- [ ] Remove hardcoded NFT contract addresses (`0x1234567890123456789012345678901234567890`)
  - [x] Update in `FormCreator.tsx` default whitelist value
  - [ ] Remove from any example/sample forms in `formStore.ts`

### Smart Contract Integration
- [ ] Implement form data storage using smart contracts or IPFS
- [ ] Create proper form submission validation on-chain
- [ ] Set up proper whitelisting mechanisms tied to NFT ownership
- [ ] Implement proper message signing for form submissions
- [x] Add support for forms without access control (public access)
  - [x] Modify smart contract logic to handle forms with no access restrictions
  - [x] Ensure proper security for data even when forms are publicly accessible

## Data Storage & Management

### Form Storage (`src/lib/formStore.ts`)
- [ ] Replace in-memory form storage with decentralized or encrypted storage
- [ ] Remove sample form data (`sampleForms` array)
- [ ] Implement proper form ID generation (not based on timestamps alone)
- [ ] Add proper encryption for form data
- [ ] Set up data persistence across sessions
- [x] Update form data model to include access control type field:
  - [x] Add `accessControl` field with possible values: `"nft"`, `"wallet"`, `"none"`
  - [x] Ensure backward compatibility with existing forms
  - [x] Add proper validation for the access control field

### Form Response Management
- [ ] Implement secure storage for form responses
- [ ] Add proper encryption for sensitive response data
- [ ] Implement access control for viewing responses
- [ ] Set up data export capabilities

## UI Components

### Marketing Content
- [ ] Extract hardcoded marketing copy from `Hero.tsx` to a content config file
- [ ] Update product taglines and descriptions with final copy
- [ ] Replace placeholder feature descriptions in `Features.tsx`
- [ ] Update call-to-action content in `CallToAction.tsx`

### Form Creator (`FormCreator.tsx`)
- [x] Replace default whitelist value (`0x1234567890123456789012345678901234567890`)
- [x] Add proper form validation
- [x] Improve UX for form creation flow
- [ ] Add form templates instead of starting with empty forms
- [x] Implement "No Access Control" option:
  - [x] Add UI element (radio button/toggle) for selecting "No Access Control"
  - [x] Update form creation interface to show/hide relevant fields based on access control selection
  - [x] Add informative tooltips explaining security implications of each access control option
  - [x] Make "No Access Control" the default option
  - [x] Implement copy-to-clipboard functionality for form links (especially useful for no access control forms)
  - [ ] Consider optional password protection for public forms as an additional security layer

### Form Viewing (`View.tsx`)
- [ ] Replace hardcoded loading states with proper skeleton components
- [ ] Improve error handling and messaging
- [ ] Add proper form response analytics
- [x] Update access control verification logic:
  - [x] Check `accessControl` field to determine verification method
  - [x] Skip wallet connection checks for forms with `accessControl: "none"` (while still requiring connection)
  - [x] Display appropriate messaging based on access control type
  - [x] Maintain existing verification for NFT and wallet-based access control
- [x] Enhance copy-to-clipboard functionality with a floating action button for form creators

## Performance & Code Quality

### TypeScript Configuration
- [ ] Enable strict type checking (update `tsconfig.json` and `tsconfig.app.json`)
- [ ] Fix `"strict": false` to `"strict": true`
- [ ] Address `noImplicitAny`, `noUnusedParameters`, and `strictNullChecks` settings

### Loading States
- [ ] Replace hardcoded dimensions in loading placeholders with responsive values
- [ ] Implement consistent loading patterns across the application

### Component Optimization
- [ ] Improve state management in form-related components
- [ ] Consider implementing context for wallet and form state

## Security

- [ ] Implement proper authentication flow
  - [ ] Use ethers.js for message signing with Sign-In with Ethereum (SIWE)
- [ ] Add rate limiting for form submissions
- [ ] Implement CSRF protection
- [ ] Secure form data with end-to-end encryption
- [ ] Add proper input sanitization for form inputs
- [x] Replace mock signature generation with actual cryptographic signing
- [ ] Add security measures for public forms:
  - [ ] Consider adding honeypot fields to prevent spam
  - [ ] Implement fraud detection for form submissions
  - [ ] Add option for CAPTCHA on public forms
  - [ ] Consider implementing view limits or expiration dates for public forms

## Additional Improvements

- [ ] Add TypeScript declarations for the window.ethereum object to fix linter warnings
- [ ] Add better error handling for NFT contract validation (in case the address isn't a valid NFT contract)
- [ ] Improve the network display by showing custom chain icons for different networks
- [ ] Add support for ERC-1155 NFTs in addition to ERC-721
- [ ] Add option to connect to specific chains and show warnings for unsupported networks
- [ ] Implement a proper wallet disconnect method (currently just clears localStorage)
- [ ] Add persistence for connected accounts between sessions using more secure methods

## Testing

- [ ] Add unit tests for core components
- [ ] Create integration tests for form submission flow
- [ ] Test wallet connection on different browsers
- [ ] Add tests for NFT gating functionality
- [ ] Set up end-to-end testing for main user flows
- [x] Test public form access functionality:
  - [x] Verify forms can be accessed with a wallet connection
  - [x] Test form submission with minimal authentication
  - [x] Verify creator can still see who submitted the form

## Documentation

- [ ] Add developer documentation for real implementations
- [ ] Document security model and encryption approach
- [ ] Create API documentation for backend services
- [ ] Add inline code comments for complex logic

## Next Steps

1. ✅ Implement ethers.js for wallet integration
2. ✅ Implement "No Access Control" option for forms as the default choice
   - ✅ Update form data model
   - ✅ Add UI elements in form creator
   - ✅ Make "No Access Control" the default option
   - ✅ Modify access verification logic
   - ✅ Add security measures for public forms
3. ✅ Replace default hardcoded whitelist value in FormCreator.tsx
4. ✅ Implement copy-to-clipboard functionality for form links
   - ✅ Add to form creation success message
   - ✅ Enhance existing form view copy button
   - ✅ Add floating action button for easy access
5. Remove hardcoded NFT contract addresses in sample forms in formStore.ts
6. Set up proper form data storage
7. Replace marketing content
8. Enable TypeScript strict mode
9. Add additional security measures for public forms (CAPTCHA, rate limiting)

Remember to address commented areas marked with "In a real implementation..." 