import { createThirdwebClient } from "thirdweb";
import { ConnectButton, useActiveWallet } from "thirdweb/react";
import { arbitrumSepolia } from "thirdweb/chains";
import { walletConnect } from "thirdweb/wallets";
import { useEffect, useState } from "react";

function App() {
  const [address, setAddress] = useState(
    "0xB6396Ad5ae35d8c79AC9D162772A753fFF01e338"
  );

  // Create thirdweb client
  const client = createThirdwebClient({
    clientId: import.meta.env.VITE_TW_CLIENT_ID,
  });
  // Get connected wallet details
  const wallet = useActiveWallet();

  const [mspoData, setMspoData] = useState(null);
  const [landDeedData, setLandDeedData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [mspoVerification, setMspoVerification] = useState(null);
  const [landDeedVerification, setLandDeedVerification] = useState(null);

  const [mspoVerificationLoader, setMspoVerificationLoader] = useState(null);
  const [landDeedVerificationLoader, setLandDeedVerificationLoader] =
    useState(null);

  // useEffect(() => {
  //   setAddress(wallet?.getAccount()?.address);
  // }, [wallet]);

  useEffect(() => {
    if (address != null) {
      fetchVcData();
      fetchProfileData();
    }
  }, [address]);

  const fetchVcData = async () => {
    setMspoData(null);
    setLandDeedData(null);
    setMspoVerification(null);
    setLandDeedVerification(null);

    // Fetch MSPO VC
    let mspoRes = await fetch(
      `${import.meta.env.VITE_API_URL}/issued-cert-vc?key=${
        import.meta.env.VITE_API_KEY
      }&secret=${import.meta.env.VITE_API_SECRET}&wallet=${address}`
    );
    let mspoData = await mspoRes.json();
    setMspoData(mspoData?.mspoToken);

    // Fetch Land Deed VC
    let landDeedRes = await fetch(
      `${import.meta.env.VITE_API_URL}/issued-land-deed?key=${
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

  const verifyVc = async (type) => {
    // console.log(address);
    let verificationUrl = `http://localhost:3000/verify?address=${address}`;
    if (type === "MSPO") {
      setMspoVerification(null);
      setMspoVerificationLoader(true);
      verificationUrl += "&type=MSPO";
    } else {
      setLandDeedVerification(null);
      setLandDeedVerificationLoader(true);
      verificationUrl += "&type=LAND_DEED";
    }
    let verificationResult = await fetch(verificationUrl);
    verificationResult = await verificationResult.json();
    setMspoVerificationLoader(false);
    setLandDeedVerificationLoader(false);
    if (verificationResult?.status == 201) {
      if (type === "MSPO") {
        setMspoVerification(verificationResult?.data?.verificationStatus);
      } else {
        setLandDeedVerification(verificationResult?.data?.verificationStatus);
      }
    }
  };

  return (
    <div style={{ marginBottom: "30px" }}>
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
          <hr />
          <h3>MSPO VC</h3>
          <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
            {JSON.stringify(mspoData?.value, null, 2)}
          </pre>
          <button onClick={() => verifyVc("MSPO")}>Verify MSPO VC</button>
          {mspoVerificationLoader ? (
            <h4>Verifying VC...</h4>
          ) : (
            mspoVerification && (
              <>
                <h4>
                  Blockchain Hash verification:{" "}
                  {mspoVerification?.onChainVC
                    ? "Verified ✅"
                    : "Not verified! ❌"}
                </h4>
                <h4>
                  VC JWT verification:{" "}
                  {mspoVerification?.vc ? "Verified ✅" : "Not verified! ❌"}
                </h4>
              </>
            )
          )}
          <hr />
        </>
      )}
      {landDeedData && (
        <>
          <h3>Land Deed VC</h3>
          <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
            {JSON.stringify(landDeedData?.value, null, 2)}
          </pre>
          <button onClick={() => verifyVc("LAND_DEED")}>
            Verify Land Deed VC
          </button>
          {landDeedVerificationLoader ? (
            <h4>Verifying VC...</h4>
          ) : (
            landDeedVerification && (
              <>
                <h4>
                  Blockchain Hash verification:{" "}
                  {landDeedVerification?.onChainVC
                    ? "Verified ✅"
                    : "Not verified! ❌"}
                </h4>
                <h4>
                  Shape file verification:{" "}
                  {landDeedVerification?.shapeFile
                    ? "Verified ✅"
                    : "Not verified! ❌"}
                </h4>
                <h4>
                  VC JWT verification:{" "}
                  {landDeedVerification?.vc
                    ? "Verified ✅"
                    : "Not verified! ❌"}
                </h4>
              </>
            )
          )}
        </>
      )}
    </div>
  );
}

export default App;
