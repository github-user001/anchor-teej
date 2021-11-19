const assert = require("assert");
const anchor = require("@project-serum/anchor");
const { SystemProgram } = anchor.web3;

/*

orders
pending
completed

create new order in pending state

back office
mark pending complete 



going with just a single for now
start small. big shits for the b[irds]

[ this is created along with the transaction where the user pays ]

one order 
{
[ selected nft ]
token wallet address
token mint hash 

maybe maybe maybe optional shopify cart ID



thoughts?
wrapped solana?

}
*/

describe("basic-1", () => {
  // Use a local provider.
  const provider = anchor.Provider.local("https://api.devnet.solana.com");

  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  it("Creates and initializes an account in a single atomic transaction (simplified)", async () => {
    // #region code-simplified
    // The program to execute.
    const program = anchor.workspace.Basic1;
    const privateKey = [
      119, 95, 179, 212, 16, 150, 55, 246, 203, 132, 41, 31, 69, 180, 137, 95,
      117, 62, 61, 148, 140, 174, 204, 147, 193, 220, 207, 222, 91, 14, 249,
      233, 75, 148, 53, 191, 57, 159, 93, 61, 33, 41, 100, 232, 135, 68, 94,
      102, 17, 62, 183, 61, 243, 192, 165, 51, 54, 163, 82, 196, 107, 65, 40,
      105,
    ];
    // The Account to create.
    const mike = anchor.web3.Keypair.fromSecretKey(new Uint8Array(privateKey));

    const myAccount = anchor.web3.Keypair.generate();

    // Create the new account and initialize it with the program.
    // #region code-simplified
    await program.rpc.initialize(new anchor.BN(1234), {
      accounts: {
        myAccount: myAccount.publicKey,
        user: mike.publicKey,
        systemProgram: SystemProgram.programId,
        destination: new anchor.web3.PublicKey(
          "A5bh7zKBchKWW9FVGNudu1J2ep95SyqK7gfhRp9ZnZpv"
        ),
      },
      signers: [mike, myAccount],
    });
    // #endregion code-simplified

    // Fetch the newly created account from the cluster.
    const account = await program.account.myAccount.fetch(myAccount.publicKey);

    // Check it's state was initialized.
    assert.ok(account.data.eq(new anchor.BN(1234)));

    // Store the account for the next test.
    // _myAccount = myAccount;
  });
});
