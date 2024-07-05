# Sample Codebase for connecting wallet, fetching Profile data, MSPO VC and Land Deed VC for the user

This codebase shows how to connect a DApp to ERC4337 mobile wallet application using WalletConnect Feature. After connecting the wallet fetch user profile data and Issued VCs for the connected user based on the wallet address.

## Getting started

Clone this repository and run the following command in the project directory:

```bash
# npm
npm install
```

This should install all the required dependencies for this project.

## Project Structure

- The `.env` file values must be filled with proper details before running the application.
- The `main.jsx` file is the entry point of the application.
- In `App.jsx` has all the required codes to connect to wallet and calling APIs.

## Environment Details

`.env` file has these fields:

- `VITE_TW_FACTORY_ADDRESS`: Address of the deployed thirdweb account factory contract
- `VITE_TW_CLIENT_ID`: Thirdweb Client Id (from thirdweb dashboard)
- `VITE_WALLET_CONNECT_PROJECT_ID`: Wallet Connect Project ID
- `VITE_API_KEY`: API Key to call 3rd party API (QCFixer API)
- `VITE_API_SECRET`: API Secret to call 3rd party API (QCFixer API)
- `VITE_API_URL`: API URL to call 3rd party API (QCFixer API)
- `CONTRACT_ADDRESS`: Blockchain contract address
- `PRIVATE_KEY`: Private key for calling contract functions using wallet provider
- `ARBITRUM_RPC`: Blockchain RPC URL

## Start The Verfier SDK

The verifier SDK is `verifierSDK-server.js` file under `vc-verification` folder. To run the verifier you need to do the following.

```bash
cd vc-verification
npm install
npm start
```

## Start The Application

Open another terminal in the root folder of the project

```bash
npm run dev
```

This will start the server and you can access the application on browser

## Configuring Thirdweb

Your `<App />` should be wrapped with `ThirdwebProvider`. In `main.jsx` file

```bash
import { ThirdwebProvider } from "thirdweb/react";
<ThirdwebProvider>
    <App />
</ThirdwebProvider>
```

To implement WalletConnect with Thirdweb ERC4337 you need this. (In `App.jsx` file)

```bash
import { createThirdwebClient } from "thirdweb";
import { ConnectButton, useActiveWallet } from "thirdweb/react";
import { arbitrumSepolia } from "thirdweb/chains";
import { walletConnect } from "thirdweb/wallets";

const [address, setAddress] = useState(null);

// Create thirdweb client
const client = createThirdwebClient({
clientId: import.meta.env.VITE_TW_CLIENT_ID,
});

// Get connected wallet details
const wallet = useActiveWallet();

// Connect to wallet button
<ConnectButton
    client={client}
    wallets={[walletConnect()]}
    accountAbstraction={{
        chain: arbitrumSepolia,
        sponsorGas: true,
        factoryAddress: import.meta.env.VITE_TW_FACTORY_ADDRESS,
    }}
    walletConnect={{
        projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
    }}
    connectModal={{
        size: "wide",
    }}
    appMetadata={{
        name: "Sample Codebase",
    }}
/>
```

## Fetch user profile data

```bash
let userProfileRes = await fetch(
    `https://vc-api.mullet.one/coreUser/${address}`
);
let profileData = await userProfileRes.json();
setProfileData(profileData?.data);
```

## Fetch issued MSPO and Land Deed VC

```bash
// Fetch MSPO VC
let mspoRes = await fetch(
    `https://spherix.my/download/issued-cert-vc?key=${
    import.meta.env.VITE_API_KEY
    }&secret=${import.meta.env.VITE_API_SECRET}&wallet=${address}`
);
let mspoData = await mspoRes.json();
setMspoData(mspoData?.mspoToken);

// Fetch Land Deed VC
let landDeedRes = await fetch(
    `https://spherix.my/download/issued-land-deed?key=${
    import.meta.env.VITE_API_KEY
    }&secret=${import.meta.env.VITE_API_SECRET}&wallet=${address}`
);
let landDeedData = await landDeedRes.json();
setLandDeedData(landDeedData?.landDeedToken);
```
