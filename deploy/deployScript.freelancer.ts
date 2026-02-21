import { deployContract } from "@genlayer/cli";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const FREELANCER_ADDRESS: string =
  process.env.FREELANCER_ADDRESS ||
  (() => {
    throw new Error("FREELANCER_ADDRESS is required. Set it in your .env file.");
  })();

const JOB_DESCRIPTION: string =
  process.env.JOB_DESCRIPTION ||
  "Build a Python web scraper that collects product names and prices " +
  "from an e-commerce site and outputs them as a CSV file. " +
  "The code must be documented, include error handling, and be hosted " +
  "in a public GitHub repository with a clear README.";

async function main() {
  console.log("🚀 Deploying FreelancerDisputeResolver...");
  console.log(`   Freelancer address : ${FREELANCER_ADDRESS}`);
  console.log(`   Job description    : ${JOB_DESCRIPTION.slice(0, 80)}...`);

  const contractPath = path.resolve(
    __dirname,
    "../contracts/freelancer_dispute_resolver.py"
  );

  const contractAddress = await deployContract({
    contractFilePath: contractPath,
    args: [FREELANCER_ADDRESS, JOB_DESCRIPTION],
  });

  console.log("\n✅ Contract deployed successfully!");
  console.log(`   Contract address: ${contractAddress}`);
  console.log(
    "\n📋 Next steps:\n" +
    "   1. Copy the contract address above.\n" +
    "   2. Add it to your .env as CONTRACT_ADDRESS=<address>\n" +
    "   3. Open GenLayer Studio and interact via Write/Read Methods."
  );
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
