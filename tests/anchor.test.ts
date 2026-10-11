describe("Counter", function () {
  this.timeout(120000);

  const counter = web3.Keypair.generate();

  const options = {
    commitment: "confirmed" as const,
    preflightCommitment: "confirmed" as const,
  };

  async function checkCount(expected: number) {
    let actual: string | undefined;

    for (let attempt = 0; attempt < 10; attempt++) {
      const account = await pg.program.account.counter.fetchNullable(
        counter.publicKey,
        "confirmed"
      );

      actual = account?.count.toString();

      if (actual === String(expected)) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    assert.equal(actual, String(expected), "Unexpected counter value");
  }

  it("Initializes with count 0", async () => {
    await pg.program.methods
      .initialize()
      .accounts({
        counter: counter.publicKey,
        user: pg.wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([counter])
      .rpc(options);

    await checkCount(0);
  });

  it("Increments to 1, 2 and 3", async () => {
    for (let expected = 1; expected <= 3; expected++) {
      await pg.program.methods
        .increment()
        .accounts({
          counter: counter.publicKey,
        })
        .rpc(options);

      await checkCount(expected);
    }
  });

  it("Rejects reinitialization and keeps count 3", async () => {
    let rejectedAsExisting = false;

    try {
      await pg.program.methods
        .initialize()
        .accounts({
          counter: counter.publicKey,
          user: pg.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([counter])
        .rpc(options);
    } catch (error) {
      const details = [
        String(error),
        ...((error as any).logs ?? []),
      ].join("\n");

      rejectedAsExisting = /already in use/i.test(details);
    }

    assert(
      rejectedAsExisting,
      "Expected rejection because the account already exists"
    );

    await checkCount(3);
  });
});
