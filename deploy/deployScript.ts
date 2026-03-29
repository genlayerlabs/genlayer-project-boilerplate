import { createClient } from "genlayer-js";
import { SimulatorTransport } from "genlayer-js/simulator";
import { privateKeyToAccount } from "genlayer-js/accounts";
import { abi } from "./SignalOracle.json";

// Initialize client
const transport = new SimulatorTransport(process.env.RPC_URL || "https://studio.genlayer.com/api");
const client = createClient({ transport });

// Account from CLI keystore
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

async function deploy() {
  console.log("Deploying SignalQualityOracle...");
  
  const contractPath = "./contracts/signal_oracle.py";
  const fs = await import("fs");
  const contractCode = fs.readFileSync(contractPath, "utf-8");

  const txHash = await client.deployContract({
    account,
    code: contractCode,
    args: [],
  });

  console.log(`Deploy tx: ${txHash}`);
  
  const receipt = await client.waitForTransactionReceipt({ hash: txHash });
  console.log(`Contract deployed at: ${receipt.contractAddress}`);
  console.log(`\nAdd this to frontend/.env:`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${receipt.contractAddress}`);
}

deploy().catch(console.error);
