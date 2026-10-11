const counter = web3.Keypair.generate();

const options = {
  commitment: "confirmed" as const,
  preflightCommitment: "confirmed" as const,
};

async function readCounter() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const account = await pg.program.account.counter.fetchNullable(
      counter.publicKey,
      "confirmed"
    );

    if (account !== null) {
      return account;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Аккаунт пока не доступен через RPC. Пришли скриншот.");
}

console.log("Program ID:", pg.program.programId.toString());
console.log("Counter address:", counter.publicKey.toString());

const initializeSignature = await pg.program.methods
  .initialize()
  .accounts({
    counter: counter.publicKey,
    user: pg.wallet.publicKey,
    systemProgram: web3.SystemProgram.programId,
  })
  .signers([counter])
  .rpc(options);

console.log(
  "Initialize:",
  `https://explorer.solana.com/tx/${initializeSignature}?cluster=devnet`
);

let account = await readCounter();
console.log("Initial count:", account.count.toString());

for (let i = 1; i <= 3; i++) {
  const signature = await pg.program.methods
    .increment()
    .accounts({
      counter: counter.publicKey,
    })
    .rpc(options);

  account = await readCounter();

  console.log("Count:", account.count.toString());
  console.log(
    "Transaction:",
    `https://explorer.solana.com/tx/${signature}?cluster=devnet`
  );
}

console.log(
  "Counter account:",
  `https://explorer.solana.com/address/${counter.publicKey}?cluster=devnet`
);
