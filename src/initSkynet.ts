import SkyMainNodeJS from "@decloudlabs/skynet/lib/services/SkyMainNodeJS";
import SkyEnvConfigNodeJS from "@decloudlabs/skynet/lib/types/types";

let initializedAppCrypto: SkyMainNodeJS;

const initializeSkyNodeCrypto = async (): Promise<SkyMainNodeJS> => {
  if (!initializedAppCrypto) {
    const envConfig: SkyEnvConfigNodeJS = {
      JRPC_PROVIDER: process.env.PROVIDER_RPC!,
      WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY!,
      STORAGE_API: {
        LIGHTHOUSE: {
          LIGHTHOUSE_API_KEY: process.env.LIGHTHOUSE_API_KEY!,
        },
        IPFS: {
          PROJECT_ID: process.env.IPFS_PROJECT_ID!,
          PROJECT_SECRET: process.env.IPFS_PROJECT_SECRET!,
        },
        CLOUD: {
          BUCKET_NAME: process.env.CLOUD_BUCKET_NAME!,
          ACCESS_KEY_ID: process.env.CLOUD_ACCESS_KEY_ID!,
          SECRET_ACCESS_KEY: process.env.CLOUD_SECRET_ACCESS_KEY!,
          REGION: process.env.CLOUD_REGION!,
        },
      },
    };
    initializedAppCrypto = new SkyMainNodeJS(envConfig);
    await initializedAppCrypto.init(true);
  }
  return initializedAppCrypto;
};

export const getSkyNode = async (): Promise<SkyMainNodeJS> => {
  return await initializeSkyNodeCrypto();
};

