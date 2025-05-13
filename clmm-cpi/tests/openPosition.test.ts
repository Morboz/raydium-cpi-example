import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { ClmmCpi } from "../target/types/clmm_cpi";
import { setupInitializeTest, initialize, openPosition, swap } from "./utils";
import { Raydium } from "@raydium-io/raydium-sdk-v2";

describe("open position test", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const owner = anchor.Wallet.local().payer;
  const connection = anchor.getProvider().connection;
  const program = anchor.workspace.ClmmCpi as Program<ClmmCpi>;

  const confirmOptions = {
    skipPreflight: true,
  };

    // 在测试开始前检查余额
  async function checkBalance(tokenMint, owner, connection) {
    try {
      const tokenAccounts = await connection.getTokenAccountsByOwner(
        owner.publicKey, 
        { mint: new anchor.web3.PublicKey(tokenMint) }
      );
      
      if (tokenAccounts.value.length > 0) {
        const accountInfo = await connection.getTokenAccountBalance(tokenAccounts.value[0].pubkey);
        console.log(`Token ${tokenMint} balance:`, accountInfo.value.uiAmount);
        return accountInfo.value.uiAmount;
      } else {
        console.log(`No token account found for mint ${tokenMint}`);
        return 0;
      }
    } catch (e) {
      console.error(`Error checking token ${tokenMint} balance:`, e);
      return 0;
    }
  }


  it("open position", async () => {
    const { token0, token0Program, token1, token1Program } =
      await setupInitializeTest(
        connection,
        owner,
        { transferFeeBasisPoints: 0, MaxFee: 0 },
        confirmOptions
      );

    // 初始余额检查
    console.log("=== 初始余额 ===");
    await checkBalance(token0.toString(), owner, connection);
    await checkBalance(token1.toString(), owner, connection);

    const { poolAddress, tx } = await initialize(
      program,
      owner,
      token0,
      token0Program,
      token1,
      token1Program,
      0,
      confirmOptions
    );

    const raydium = await Raydium.load({
      owner,
      connection,
    });

    const data = await raydium.clmm.getPoolInfoFromRpc(poolAddress.toString());

    const { tx: openTx } = await openPosition(
      program,
      owner,
      data.poolKeys,
      -10,
      10,
      new BN("101000000000000"),
      new BN("1010000000000000"),
      new BN("1010000000000000"),
      confirmOptions
    );
    console.log("=== 最终余额 ===");
    await checkBalance(token0.toString(), owner, connection);
    await checkBalance(token1.toString(), owner, connection);

    console.log(" openTx:", openTx);
    
    // 进行一次 swap 操作
    console.log("执行 swap 操作...");
    // 在 openPosition.test.ts 中
    try {
      console.log("Pool data:", {
        id: data.poolKeys.id,
        mintA: data.poolKeys.mintA.address,
        mintB: data.poolKeys.mintB.address,
        tickSpacing: data.poolKeys.config.tickSpacing,
        currentTickIndex: data.poolKeys.currentTickIndex,
        hasTickArrays: !!(data.poolKeys.tickArrays && data.poolKeys.tickArrays.length > 0)
      });

      // 直接创建一个初始 tick array
      console.log("Creating initial tick array...");
      const initialTickArrayStartIndex = 0; // 使用 0 作为初始 tick array
      const [initialTickArray] = await getTickArrayAddress(
        new PublicKey(data.poolKeys.id),
        ClmmProgram,
        initialTickArrayStartIndex
      );
      
      console.log("Initial tick array address:", initialTickArray.toString());

      // 创建 tick array 的指令
      const createTickArrayTx = await program.methods
        .createTickArray(initialTickArrayStartIndex)
        .accounts({
          payer: owner.publicKey,
          poolState: new PublicKey(data.poolKeys.id),
          tickArray: initialTickArray,
          systemProgram: SystemProgram.programId,
        })
        .rpc(confirmOptions);

      console.log("Created tick array:", createTickArrayTx);

      // 然后执行 swap
      const { tx: swapTx } = await swap(
        program,
        owner,
        data.poolKeys,
        swapAmount,
        otherAmountThreshold, 
        sqrtPriceLimitX64,
        isBaseInput,
        confirmOptions
      );
      
      console.log("=== Swap 后的余额 ===");
      await checkBalance(token0.toString(), owner, connection);
      await checkBalance(token1.toString(), owner, connection);
    } catch (error) {
      console.error("Swap 操作失败:", error);
      console.error("错误详情:", error);
      if (error.stack) console.error("错误堆栈:", error.stack);
    }
  });
});
