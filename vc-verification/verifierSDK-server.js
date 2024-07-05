var CryptoJS = require("crypto-js");
const { Web3 } = require("web3");
const Provider = require("@truffle/hdwallet-provider");
const SmartContractABI = require("./abi.json");
const fs = require("fs");
const path = require("path");
const DidResolver = require("did-resolver");
const WebDidResolver = require("web-did-resolver");
const DidJwtVc = require("did-jwt-vc");
const _ = require("lodash");
const axios = require("axios");
const express = require("express");
const app = express();
const port = 3000;
var cors = require("cors");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];
app.use(cors({ origin: allowedOrigins }));

//Function to verify VC
const verifyVC = async (type, walletAddress) => {
  try {
    let paramName;
    let data = {};
    let URL = process.env.VITE_API_URL;
    const apiKey = process.env.VITE_API_KEY;
    const apiSecret = process.env.VITE_API_SECRET;
    if (type === "LAND_DEED") {
      URL += `/issued-land-deed`;
      paramName = "landDeedToken";
    } else if (type === "MSPO") {
      URL += `/issued-cert-vc`;
      paramName = "mspoToken";
    }
    const params = {
      key: apiKey,
      secret: apiSecret,
      wallet: walletAddress,
    };
    const response = await axios.get(URL, {
      params,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response) {
      let vcDetails = convertKeysToLowercase(response.data[paramName]);
      vcDetails = vcDetails?.value;
      if (type === "LAND_DEED") {
        //verification process of landdeed
        const responses = await Promise.allSettled([
          verifyVCJwt(vcDetails),
          verifyHashOfVC(vcDetails, walletAddress),
          verifyShapeFileHash(vcDetails),
        ]);
        const [jwtVerify, onchainVerify, shapeFileVerify] = responses;
        data = {
          vc: jwtVerify.status === "fulfilled" ? jwtVerify.value : false,
          onChainVC:
            onchainVerify.status === "fulfilled" ? onchainVerify.value : false,
          shapeFile:
            shapeFileVerify.status === "fulfilled"
              ? shapeFileVerify.value
              : false,
        };
      } else {
        //verification process of mspo
        const responses = await Promise.allSettled([
          verifyVCJwt(vcDetails),
          verifyHashOfVC(vcDetails, walletAddress),
        ]);
        const [jwtVerify, onchainVerify] = responses;
        data = {
          vc: jwtVerify.status === "fulfilled" ? jwtVerify.value : false,
          onChainVC:
            onchainVerify.status === "fulfilled" ? onchainVerify.value : false,
        };
      }

      const verificationStatus = {
        verificationStatus: { ...data },
      };

      return {
        error: false,
        message: "Verification Status Generated.",
        data: verificationStatus,
      };
    } else {
      return {
        error: true,
        message: "Internal error occurred! Please try again",
      };
    }
  } catch (error) {
    console.log(error);
    return {
      error: true,
      message: error.message,
    };
  }
};

//JWT verify Logic
const verifyVCJwt = (currentVC) => {
  const promise = new Promise(async (resolve, reject) => {
    try {
      // Your logic for verifying LandDeed VC
      const webResolver = WebDidResolver.getResolver();
      const resolver = new DidResolver.Resolver({
        ...webResolver,
      });
      const verifiedVC = await DidJwtVc.verifyCredential(
        currentVC?.proof?.jwt,
        resolver
      );
      let vcMatching = _.isEqual(currentVC, verifiedVC?.verifiableCredential);
      console.log("🚀 ~ promise ~ vcMatching:", vcMatching);
      resolve(verifiedVC?.verified && vcMatching);
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
  return promise;
};

//verify On-Chain hashed VC with actual VC
const verifyHashOfVC = (vcDetails, address) => {
  const promise = new Promise(async (resolve, reject) => {
    try {
      const provider = new Provider(
        process.env.PRIVATE_KEY,
        process.env.ARBITRUM_RPC
      );
      const web3 = new Web3(provider);
      const myContract = new web3.eth.Contract(
        SmartContractABI,
        process.env.CONTRACT_ADDRESS
      );
      var receipt = await myContract.methods.getCredentials(address, 1).call();
      const hashedVC = CryptoJS.SHA256(JSON.stringify(vcDetails)).toString();
      //Checking if the hash are matching or not, if there are multiple vc issued against the wallet address
      const hashedVerified = vcHashChecker(hashedVC, receipt);
      resolve(hashedVerified);
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
  return promise;
};

const vcHashChecker = (hashedVC, onChainVCData = []) => {
  let flag;
  for (let i = 0; i < onChainVCData.length; i++) {
    const verified = _.isEqual(onChainVCData[i].encryptedCredential, hashedVC);
    if (verified) {
      flag = verified;
      break;
    }
  }
  return flag;
};

//Verify shapefile hash
const verifyShapeFileHash = (vcDetails) => {
  const promise = new Promise(async (resolve, reject) => {
    try {
      const {
        credentialSubject: { ShapeFile, shapefileHash },
      } = vcDetails;
      const filename = await downloadFile(ShapeFile);
      hash = await calculateSHA256Hash(filename);
      const shapeFileHashMatching = _.isEqual(hash, shapefileHash);
      fs.unlink(filename, (err) => {
        if (err) {
          reject(err);
        }
        console.log(`${filename} was deleted`);
      });
      resolve(shapeFileHashMatching);
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
  return promise;
};

const downloadFile = async (url) => {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
  const fileName = `shapefile-${timestamp}.shp`;
  const writer = fs.createWriteStream(fileName);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve(fileName));
    writer.on(
      "error",
      reject({
        error: true,
        message: "Unable to download shape file",
        data: null,
      })
    );
  });
};

const calculateSHA256Hash = (fileName) => {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, (err, data) => {
      if (err) {
        reject({
          error: true,
          message: err,
          data: null,
        });
      } else {
        const sha256Hash = CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
        resolve(sha256Hash);
      }
    });
  });
};

const convertKeysToLowercase = (obj) => {
  const lowerCaseObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      lowerCaseObj[key.toLowerCase()] = obj[key];
    }
  }
  return lowerCaseObj;
};

//To verify hash call this functiob

// verifyVC("LAND_DEED" || "MSPO", "0x0CE1....");

app.get("/verify", async (req, res) => {
  const { address, type } = req.query;
  const verificationResult = await verifyVC(type, address);
  if (verificationResult?.error) {
    res.status(500).json({
      status: 500,
      message: verificationResult?.message,
      data: null,
    });
  } else {
    res.status(201).json({
      status: 201,
      message: verificationResult?.message,
      data: verificationResult?.data,
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 ~ Verification SDK is running at http://localhost:${port}`);
});

//Return type for LAND_DEED
// `{
//     "status": 201,
//     "message": "Verification Status Generated.",
//     "data": {
//         "verificationStatus": {
//             "vc": true | false,
//             "onChainVC": true | false,
//             "shapeFile": true | false
//         }
//     }
// }`;

// //Return  type for MSPO
// `{
//     "status": 201,
//     "message": "Verification Status Generated.",
//     "data": {
//         "verificationStatus": {
//             "vc": true | false,
//             "onChainVC": true | false,
//         }
//     }
// }`;
