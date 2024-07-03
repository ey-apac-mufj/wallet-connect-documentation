import { createThirdwebClient } from "thirdweb";
import { ConnectButton, useActiveWallet } from "thirdweb/react";
import { arbitrumSepolia } from "thirdweb/chains";
import { walletConnect } from "thirdweb/wallets";
import { useEffect, useState } from "react";

function App() {
  const [address, setAddress] = useState(null);

  // Create thirdweb client
  const client = createThirdwebClient({
    clientId: import.meta.env.VITE_TW_CLIENT_ID,
  });
  // Get connected wallet details
  const wallet = useActiveWallet();

  const [mspoData, setMspoData] = useState(null);
  const [landDeedData, setLandDeedData] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    setAddress(wallet?.getAccount()?.address);
  }, [wallet]);

  useEffect(() => {
    if (address != null) {
      fetchVcData();
      fetchProfileData();
    }
  }, [address]);

  const fetchVcData = async () => {
    setMspoData(null);
    setLandDeedData(null);

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
  };

  const fetchProfileData = async () => {
    setProfileData(null);

    // Fetch Profile data
    let userProfileRes = await fetch(
      `https://vc-api.mullet.one/coreUser/${address}`
    );
    let profileData = await userProfileRes.json();
    setProfileData(profileData?.data);
  };

  return (
    <div>
      <h1 style={{ textAlign: "center" }}>Demo Code</h1>
      <div style={{ textAlign: "center" }}>
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
      </div>
      {!address && (
        <h2 style={{ textAlign: "center" }}>
          Please connect wallet to see details
        </h2>
      )}
      {profileData && (
        <>
          <h3>User Profile Details</h3>
          <h5 style={{ marginBottom: "0", marginTop: "10px" }}>
            Name: {profileData?.name}
          </h5>
          <h5 style={{ marginBottom: "0", marginTop: "10px" }}>
            Email: {profileData?.email}
          </h5>
          <h5 style={{ marginBottom: "0", marginTop: "10px" }}>
            Wallet Address: {profileData?.walletAddress}
          </h5>
          <h5 style={{ marginBottom: "0", marginTop: "10px" }}>
            User Id: {profileData?.userId}
          </h5>
          <h5 style={{ marginBottom: "0", marginTop: "10px" }}>
            Type: {profileData?.type}
          </h5>
        </>
      )}
      {mspoData && (
        <>
          <h3>MSPO VC</h3>
          <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
            {JSON.stringify(mspoData?.value, null, 2)}
          </pre>
        </>
      )}
      {landDeedData && (
        <>
          <h3>Land Deed VC</h3>
          <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
            {JSON.stringify(landDeedData?.value, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}

export default App;
