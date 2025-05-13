import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { CpmmCpiExample } from "../target/types/cpmm_cpi_example";
import { setupSwapTest, swap_base_input, swap_base_output } from "./utils";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { configAddress } from "./config";

describe("swap test", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const owner = anchor.Wallet.local().payer;
  const connection = anchor.getProvider().connection;
  const program = anchor.workspace.CpmmCpiExample as Program<CpmmCpiExample>;

  const confirmOptions = {
    skipPreflight: true,
  };

  // 添加检查余额的辅助函数
  async function checkBalance(tokenMint, owner, tokenProgram) {
    try {
      const tokenAccount = getAssociatedTokenAddressSync(
        tokenMint,
        owner.publicKey,
        false,
        tokenProgram
      );
      
      const tokenAmount = await connection.getTokenAccountBalance(tokenAccount);
      console.log(`Token ${tokenMint.toString()} 余额: ${tokenAmount.value.uiAmount}`);
      return tokenAmount.value.uiAmount;
    } catch (e) {
      console.error(`检查代币余额时出错:`, e);
      return 0;
    }
  }

  it("swap base input", async () => {
    const cpSwapPoolState = await setupSwapTest(
      program,
      connection,
      owner,
      { transferFeeBasisPoints: 0, MaxFee: 0 }
    );
    const inputToken = cpSwapPoolState.token0Mint;
    const inputTokenProgram = cpSwapPoolState.token0Program;
    const outputToken = cpSwapPoolState.token1Mint;
    const outputTokenProgram = cpSwapPoolState.token1Program;
    let amount_in = new BN(100000000);
    
    // Swap 前检查余额
    console.log("=== Swap 前余额 ===");
    const inputBalanceBefore = await checkBalance(inputToken, owner, inputTokenProgram);
    const outputBalanceBefore = await checkBalance(outputToken, owner, outputTokenProgram);
    
    // 执行 swap
    const baseInTx = await swap_base_input(
      program,
      owner,
      configAddress,
      inputToken,
      inputTokenProgram,
      outputToken,
      outputTokenProgram,
      amount_in,
      new BN(0),
      confirmOptions
    );
    console.log("baseInputTx:", baseInTx);
    
    // Swap 后检查余额
    console.log("=== Swap 后余额 ===");
    const inputBalanceAfter = await checkBalance(inputToken, owner, inputTokenProgram);
    const outputBalanceAfter = await checkBalance(outputToken, owner, outputTokenProgram);
    
    // 计算变化量
    console.log("=== 余额变化 ===");
    console.log(`输入代币减少: ${(inputBalanceBefore - inputBalanceAfter).toFixed(9)}`);
    console.log(`输出代币增加: ${(outputBalanceAfter - outputBalanceBefore).toFixed(9)}`);
  });

  it("swap base output ", async () => {
    const cpSwapPoolState = await setupSwapTest(
      program,
      connection,
      owner,
      { transferFeeBasisPoints: 0, MaxFee: 0 }
    );
    const inputToken = cpSwapPoolState.token0Mint;
    const inputTokenProgram = cpSwapPoolState.token0Program;
    const outputToken = cpSwapPoolState.token1Mint;
    const outputTokenProgram = cpSwapPoolState.token1Program;
    let amount_out = new BN(100000000);
    
    // Swap 前检查余额
    console.log("=== Swap 前余额 ===");
    const inputBalanceBefore = await checkBalance(inputToken, owner, inputTokenProgram);
    const outputBalanceBefore = await checkBalance(outputToken, owner, outputTokenProgram);
    
    // 执行 swap
    const baseOutTx = await swap_base_output(
      program,
      owner,
      configAddress,
      inputToken,
      inputTokenProgram,
      outputToken,
      outputTokenProgram,
      amount_out,
      new BN(10000000000000),
      confirmOptions
    );
    console.log("baseOutputTx:", baseOutTx);
    
    // Swap 后检查余额
    console.log("=== Swap 后余额 ===");
    const inputBalanceAfter = await checkBalance(inputToken, owner, inputTokenProgram);
    const outputBalanceAfter = await checkBalance(outputToken, owner, outputTokenProgram);
    
    // 计算变化量
    console.log("=== 余额变化 ===");
    console.log(`输入代币减少: ${(inputBalanceBefore - inputBalanceAfter).toFixed(9)}`);
    console.log(`输出代币增加: ${(outputBalanceAfter - outputBalanceBefore).toFixed(9)}`);
  });
});