import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import { PublicKey } from "@solana/web3.js";
import { UserPlusIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
require('@solana/wallet-adapter-react-ui/styles.css');

interface ITransaction {
  address: string;
  amount: number
}

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const WalletMultiButton = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
  );

  const [balance, setBalance] = useState<number>()
  const [popUpAddUser, setPopUpAddUser] = useState<boolean>(false)
  const [friend, setFriend] = useState<{ name?: string, address?: string }>({})
  const [friends, setFriends] = useState<{ name?: string, address?: string }[]>([])
  const [transaction, setTransaction] = useState<ITransaction>({} as ITransaction)
  const [txSig, setTxSig] = useState('');

  const { connection } = useConnection();
  // user's public key of the wallet they connected to our application
  const { publicKey, sendTransaction } = useWallet();

  useEffect(() => {
    const getInfo = async () => {
      if (connection && publicKey) {
        console.log(publicKey)
        // we get the account info for the user's wallet data store and set the balance in our application's state
        const balance = await connection.getBalance(publicKey);

        setBalance(balance! / web3.LAMPORTS_PER_SOL);

        const localFriends = localStorage.getItem('friends')
        if (localFriends) setFriends(JSON.parse(localFriends))

      }
    }
    getInfo();
    // the code above will execute whenever these variables change in any way
  }, [connection, publicKey]);

  const handleTransaction = async () => {
    if (connection && publicKey) {
      const transactionWeb3 = new web3.Transaction();


      const toPubkey = new PublicKey(transaction.address)
      const instruction = web3.SystemProgram.transfer({
        fromPubkey: publicKey,
        lamports: transaction.amount * web3.LAMPORTS_PER_SOL,
        toPubkey
      });

      transactionWeb3.add(instruction);

      try {
        const signature = await sendTransaction(transactionWeb3, connection);
        setTxSig(signature)
        if (balance) {
          const newBalance = balance - transaction.amount;
          setBalance(newBalance);
        }

      }
      catch (error) {
        console.log(error);
      }
      finally {
        setTransaction({} as ITransaction)
      }
    }
  };

  return (
    <div
      className={`flex h-screen flex-col items-center justify-center p-24 ${inter.className}`}
    >

      <div
        className="relative w-80 h-96 bg-fuchsia-800 rounded-md p-4 items-center flex flex-col gap-8"
      >
        {
          !connection && !publicKey ?
            <WalletMultiButton />
            :

            <>
              <div
                className="w-full relative"
              >
                <UserPlusIcon
                  className="h-4 w-4"
                  onClick={() => {
                    setPopUpAddUser(true)
                  }}
                />
                {
                  popUpAddUser &&
                  <div
                    className="absolute flex flex-col top-full left-0 p-4 rounded-md bg-zinc-800 gap-4"
                  >
                    <input type="text" placeholder="Insert Friend Name"
                      className="rounded-md px-1 text-black"
                      onChange={(e) => {
                        setFriend({
                          ...friend,
                          name: e.target.value
                        })
                      }}
                    />
                    <input type="text" placeholder="Insert Friend Address"
                      className="rounded-md px-1 text-black"
                      onChange={(e) => {
                        setFriend({
                          ...friend,
                          address: e.target.value
                        })
                      }}
                    />

                    <div
                      className="flex gap-4 items-center justify-center"
                    >
                      <button className=" px-2 py-1 bg-red-500 rounded-md"
                        onClick={() => setPopUpAddUser(false)}
                      >
                        Cancel
                      </button>
                      <button className='px-2 py-1 bg-green-500 rounded-md'
                        onClick={() => {
                          const localFriends = localStorage.getItem('friends')
                          if (localFriends) {
                            const friends = JSON.parse(localFriends)
                            const newFriend: any = [
                              ...friends,
                              friend
                            ]
                            localStorage.setItem('friends', JSON.stringify(newFriend))
                            setFriends(newFriend)
                          } else {
                            localStorage.setItem('friends', JSON.stringify([
                              friend
                            ]))
                            setFriends([friend])
                          }
                          setPopUpAddUser(false)
                        }}
                      >
                        Add!
                      </button>
                    </div>
                  </div>
                }
              </div>
              <div
                className="flex flex-col w-2/3 bg-fuchsia-500 rounded-md px-5 py-2 items-center"
              >
                <h2 >Balance</h2>

                <div
                  className="flex gap-5"
                >
                  <p>SOL:</p>
                  <p>
                    {balance}
                  </p>
                </div>
              </div>

              <div
                className="flex flex-col w-2/3 bg-fuchsia-500 rounded-md px-5 py-2 items-center"
              >
                <h2 >Transaction</h2>

                <div
                  className="flex flex-col items-center text-black gap-5"
                >
                  <select name="" id=""
                    defaultValue={0}
                    className="w-full"
                    onChange={(e) => setTransaction({
                      ...transaction,
                      address: e.target.value
                    })}
                  >
                    <option disabled key={0} value={0}>Select Your Friend</option>
                    {
                      friends.map((friend) => {
                        return (
                          <option key={friend.address?.toString()} value={friends[0]?.address?.toString()}>{friend.name}</option>
                        )
                      })
                    }
                  </select>
                  <input type="number" placeholder="amountSOL" value={transaction.amount}
                    onChange={(e) => {
                      setTransaction({
                        ...transaction,
                        amount: Number(e.target.value)
                      })
                    }}
                  />
                  <button className=" px-2 py-1 bg-black rounded-md text-white"
                    onClick={handleTransaction}
                  >
                    Transfer
                  </button>
                </div>
              </div>
              {
                txSig &&
                <div
                className="absolute flex flex-col p-4 rounded-md w-2/3 h-28 bg-gray-600"
                >
                  <p className="font-bold text-lg">Success</p>
                  <Link
                  className="truncate w-full decoration-current text-blue-500"
                    href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                  >
                    https://explorer.solana.com/tx/${txSig}?cluster=devnet
                  </Link>
                  <button onClick={()=>{setTxSig("")}} >OK</button>
                </div>
              }
            </>
        }
      </div>
    </div>

  );
}
