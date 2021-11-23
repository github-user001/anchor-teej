const anchor = require("@project-serum/anchor");
const BN = require("bn.js");
const expect = require("chai").expect;
const { SystemProgram, LAMPORTS_PER_SOL } = anchor.web3;

const privateKey = [
  119, 95, 179, 212, 16, 150, 55, 246, 203, 132, 41, 31, 69, 180, 137, 95, 117,
  62, 61, 148, 140, 174, 204, 147, 193, 220, 207, 222, 91, 14, 249, 233, 75,
  148, 53, 191, 57, 159, 93, 61, 33, 41, 100, 232, 135, 68, 94, 102, 17, 62,
  183, 61, 243, 192, 165, 51, 54, 163, 82, 196, 107, 65, 40, 105,
];
// The Account to create.
const mike = anchor.web3.Keypair.fromSecretKey(new Uint8Array(privateKey));
const sxeteej = "A5bh7zKBchKWW9FVGNudu1J2ep95SyqK7gfhRp9ZnZpv";

const tokenAccount = "6s1KncZxM7ysEYHFi89TZrtsq5oVRVgtsGjYHst3Dawx";
const tokenMintHash = "HioTNxi2rsWaTrBhpywe8Ai6eRXZk8McnAJAHFf57UrC";

describe("basic-1", () => {
  // Use a local provider.
  const devnet = "https://api.devnet.solana.com";
  const provider = anchor.Provider.local(devnet, { commitment: "confirmed" });
  anchor.setProvider(provider);
  const mainProgram = anchor.workspace.Basic1;

  function expectBalance(actual, expected, message, slack = 20000) {
    expect(actual, message).within(expected - slack, expected + slack);
  }

  async function createUser(airdropBalance) {
    airdropBalance = airdropBalance ?? 2 * LAMPORTS_PER_SOL;
    let user = anchor.web3.Keypair.generate();
    let sig = await provider.connection.requestAirdrop(
      user.publicKey,
      airdropBalance
    );
    await provider.connection.confirmTransaction(sig);

    let wallet = new anchor.Wallet(user);
    let userProvider = new anchor.Provider(
      provider.connection,
      wallet,
      provider.opts
    );

    return {
      key: user,
      wallet,
      provider: userProvider,
    };
  }

  function createUsers(numUsers) {
    let promises = [];
    for (let i = 0; i < numUsers; i++) {
      promises.push(createUser());
    }

    return Promise.all(promises);
  }

  async function getAccountBalance(pubkey) {
    let account = await provider.connection.getAccountInfo(pubkey);
    return account?.lamports ?? 0;
  }

  function programForUser(user) {
    return new anchor.Program(
      mainProgram.idl,
      mainProgram.programId,
      user.provider
    );
  }

  async function createList(owner, orderMaxCount = 16) {
    const [listAccount, bump] = await anchor.web3.PublicKey.findProgramAddress(
      ["orderlist", owner.key.publicKey.toBytes()],
      mainProgram.programId
    );

    let program = programForUser(owner);
    await program.rpc.initialize(orderMaxCount, bump, {
      accounts: {
        orderList: listAccount,
        user: owner.key.publicKey,
        slabTreasury: mike.publicKey.toBase58(),
        systemProgram: SystemProgram.programId,
      },
    });

    console.log("this will ");
    let list = await program.account.orderList.fetch(listAccount);
    return { publicKey: listAccount, data: list };
  }

  describe("newList", () => {
    it("creates a list", async () => {
      const owner = await createUser();
      const balance = await getAccountBalance(owner.key.publicKey);
      console.log({ balance });
      let list = await createList(owner);
      console.log({ list });

      expect(list.data.listOwner.toString(), "List owner is set").equals(
        owner.key.publicKey.toString()
      );
      expect(list.data.orders.length, "User has no orders yet").equals(0);
    });
  });

  it.skip("Creates and initializes an account in a single atomic transaction (simplified)", async () => {
    // #region code-simplified
    // The program to execute.
    const program = anchor.workspace.Basic1;
    const myAccount = anchor.web3.Keypair.generate();

    const tokenAccount = "6s1KncZxM7ysEYHFi89TZrtsq5oVRVgtsGjYHst3Dawx";
    const tokenMintHash = "HioTNxi2rsWaTrBhpywe8Ai6eRXZk8McnAJAHFf57UrC";

    // Create the new account and initialize it with the program.
    // #region code-simplified
    try {
      await program.rpc.initialize(
        new anchor.BN(1236),
        new anchor.web3.PublicKey(tokenAccount),
        new anchor.web3.PublicKey(tokenMintHash),
        {
          accounts: {
            myAccount: myAccount.publicKey,
            user: mike.publicKey,
            systemProgram: SystemProgram.programId,
            destination: new anchor.web3.PublicKey(sxeteej),
          },
          signers: [mike, myAccount],
        }
      );
      // #endregion code-simplified
    } catch (e) {
      console.log({ e });
      // assert.ok(
      //   e.msg === "Not enough SOL. A slab costs 1 SOL.",
      //   "Defo should have crashed here, NGMI"
      // );
      // return;
    }

    // Fetch the newly created account from the cluster.
    const account = await program.account.myAccount.fetch(myAccount.publicKey);

    // Check it's state was initialized.
    assert.ok(account.data.eq(new anchor.BN(1236)));
    console.log(account);
    assert.equal(4, 5);
    // assert.ok(account.mintHas.eq(tokenMintHash));

    // Store the account for the next test.
    // _myAccount = myAccount;
  });

  it.skip("should derive a predictable address", async () => {
    const program = anchor.workspace.Basic1;
    const [_programSigner, bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [mike.publicKey.toBase58().substring(0, 8)],
        // [sxeteej.substring(0, 8)],
        program.programId
      );
    console.log({ _programSigner }); //d315878ee670c9f8a6792289b0893909bc76c40ccfd8c416acc4390b4f312331>
    // b8c86e4764acf14a375b9acc54d9eeeb9b867b5cb7d6e32329e7888de3e4ddb7>
  });
});
