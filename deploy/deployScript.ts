import { readFileSync } from "fs";
import path from "path";
import {
  TransactionHash,
  TransactionStatus,
  GenLayerClient,
  DecodedDeployData,
  GenLayerChain,
} from "genlayer-js/types";
import { localnet } from "genlayer-js/chains";

// TODO: Once genlayer-js v2 ships, migrate this deploy flow to:
// - waitUntil: "decided"
// - isSuccessful(receipt)
// - explicit fee options

export default async function main(client: GenLayerClient<any>) {
  const filePath = path.resolve(process.cwd(), "contracts/football_bets.py");

  try {
    const contractCode = new Uint8Array(readFileSync(filePath));

    await client.initializeConsensusSmartContract();

    const deployTransaction = await client.deployContract({
      code: contractCode,
      args: [],
    });

    const receipt = await client.waitForTransactionReceipt({
      hash: deployTransaction as TransactionHash,
      status: TransactionStatus.ACCEPTED,
      retries: 200,
    });

    if (
      receipt.status !== 5 &&
      receipt.status !== 6 &&
      receipt.statusName !== "ACCEPTED" &&
      receipt.statusName !== "FINALIZED"
    ) {
      throw new Error(`Deployment failed. Receipt: ${JSON.stringify(receipt)}`);
    }

    const receiptWithExecution = receipt as typeof receipt & {
      txExecutionResultName?: string;
      tx_execution_result_name?: string;
      consensus_data?: {
        leader_receipt?:
          | { execution_result?: string }
          | Array<{ execution_result?: string }>;
      };
    };
    const leaderReceipt = Array.isArray(
      receiptWithExecution.consensus_data?.leader_receipt,
    )
      ? receiptWithExecution.consensus_data?.leader_receipt[0]
      : receiptWithExecution.consensus_data?.leader_receipt;
    const executionResult =
      receiptWithExecution.txExecutionResultName ??
      receiptWithExecution.tx_execution_result_name ??
      leaderReceipt?.execution_result;

    if (
      executionResult !== "SUCCESS" &&
      executionResult !== "FINISHED_WITH_RETURN"
    ) {
      throw new Error(
        `Deployment execution failed. Status: ${
          receipt.statusName ?? receipt.status
        }; execution result: ${executionResult ?? "missing"}.`,
      );
    }

    const deployedContractAddress =
      (client.chain as GenLayerChain).id === localnet.id
        ? receipt.data.contract_address
        : (receipt.txDataDecoded as DecodedDeployData)?.contractAddress;

    console.log(`Contract deployed at address: ${deployedContractAddress}`);
  } catch (error) {
    throw new Error(`Error during deployment:, ${error}`);
  }
}
