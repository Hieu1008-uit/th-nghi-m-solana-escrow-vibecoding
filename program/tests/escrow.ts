import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import BN from "bn.js";

describe("escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Escrow as Program<Escrow>;

  const maker = Keypair.generate();
  const taker = Keypair.generate();

  let mintA: PublicKey;
  let mintB: PublicKey;

  let makerTokenAccountA: PublicKey;
  let makerTokenAccountB: PublicKey;
  let takerTokenAccountA: PublicKey;
  let takerTokenAccountB: PublicKey;

  const seed = new BN(12345);
  const depositAmount = new BN(100);
  const receiveAmount = new BN(200);

  before(async () => {
    // Airdrop SOL to maker and taker
    const airdropMaker = await provider.connection.requestAirdrop(
      maker.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropMaker);

    const airdropTaker = await provider.connection.requestAirdrop(
      taker.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTaker);

    // Create Token Mints
    mintA = await createMint(
      provider.connection,
      (provider.wallet as any).payer,
      provider.publicKey,
      null,
      6
    );

    mintB = await createMint(
      provider.connection,
      (provider.wallet as any).payer,
      provider.publicKey,
      null,
      6
    );

    // Create Token Accounts
    makerTokenAccountA = getAssociatedTokenAddressSync(mintA, maker.publicKey);
    makerTokenAccountB = getAssociatedTokenAddressSync(mintB, maker.publicKey);
    takerTokenAccountA = getAssociatedTokenAddressSync(mintA, taker.publicKey);
    takerTokenAccountB = getAssociatedTokenAddressSync(mintB, taker.publicKey);

    await createAccount(
      provider.connection,
      (provider.wallet as any).payer,
      mintA,
      maker.publicKey,
      maker
    );

    await createAccount(
      provider.connection,
      (provider.wallet as any).payer,
      mintB,
      taker.publicKey,
      taker
    );

    // Mint initial tokens
    await mintTo(
      provider.connection,
      (provider.wallet as any).payer,
      mintA,
      makerTokenAccountA,
      provider.publicKey,
      500
    );

    await mintTo(
      provider.connection,
      (provider.wallet as any).payer,
      mintB,
      takerTokenAccountB,
      provider.publicKey,
      500
    );
  });

  it("Maker creates an escrow offer", async () => {
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        maker.publicKey.toBuffer(),
        seed.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    const vault = getAssociatedTokenAddressSync(mintA, escrowPda, true);

    await program.methods
      .make(seed, depositAmount, receiveAmount)
      .accounts({
        maker: maker.publicKey,
        mintA: mintA,
        mintB: mintB,
        makerTokenAccountA: makerTokenAccountA,
        escrow: escrowPda,
        vault: vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([maker])
      .rpc();

    // Verify vault balance
    const vaultAccount = await getAccount(provider.connection, vault);
    assert.equal(vaultAccount.amount.toString(), depositAmount.toString());

    // Verify escrow state
    const escrowAccount = await program.account.escrow.fetch(escrowPda);
    assert.equal(escrowAccount.maker.toBase58(), maker.publicKey.toBase58());
    assert.equal(escrowAccount.mintA.toBase58(), mintA.toBase58());
    assert.equal(escrowAccount.mintB.toBase58(), mintB.toBase58());
    assert.equal(
      escrowAccount.receiveAmount.toString(),
      receiveAmount.toString()
    );
  });

  it("Taker fulfills the escrow offer", async () => {
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        maker.publicKey.toBuffer(),
        seed.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    const vault = getAssociatedTokenAddressSync(mintA, escrowPda, true);

    await program.methods
      .take()
      .accounts({
        taker: taker.publicKey,
        maker: maker.publicKey,
        mintA: mintA,
        mintB: mintB,
        takerTokenAccountA: takerTokenAccountA,
        takerTokenAccountB: takerTokenAccountB,
        makerTokenAccountB: makerTokenAccountB,
        escrow: escrowPda,
        vault: vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID
      })
      .signers([taker])
      .rpc();

    // Check balances
    const makerAccountB = await getAccount(
      provider.connection,
      makerTokenAccountB
    );
    assert.equal(makerAccountB.amount.toString(), receiveAmount.toString());

    const takerAccountA = await getAccount(
      provider.connection,
      takerTokenAccountA
    );
    assert.equal(takerAccountA.amount.toString(), depositAmount.toString());
  });
});
