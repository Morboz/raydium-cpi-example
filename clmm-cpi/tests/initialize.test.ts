import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ClmmCpi } from "../target/types/clmm_cpi";
import { setupInitializeTest, initialize } from "./utils";

describe("initialize test", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const owner = anchor.Wallet.local().payer;
  const program = anchor.workspace.ClmmCpi as Program<ClmmCpi>;

  const confirmOptions = {
    skipPreflight: true,
  };

  it("create pool", async () => {
    const { token0, token0Program, token1, token1Program } =
      await setupInitializeTest(
        anchor.getProvider().connection,
        owner,
        { transferFeeBasisPoints: 0, MaxFee: 0 },
        confirmOptions
      );
    
    // 打印代币地址
    console.log("Token0 address:", token0.toString());
    console.log("Token1 address:", token1.toString());
    console.log("Token0 program:", token0Program.toString());
    console.log("Token1 program:", token1Program.toString());

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

    console.log("pool address: ", poolAddress.toString(), " tx:", tx);
  });
});