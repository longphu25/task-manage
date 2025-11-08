import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { ENV } from "../env";
import { getAddress } from "./getAddress";
import { suiClient } from "../suiClient";
import { getSigner } from "./getSigner";

/**
 * Builds, signs, and executes a transaction for:
 * * minting a Hero NFT
 * * minting a Weapon NFT
 * * attaching the Weapon to the Hero
 * * transferring the Hero to the signer's address
 */
export const mintHeroWithWeapon =
  async (): Promise<SuiTransactionBlockResponse> => {
    // TODO: Implement the function
    // return {} as SuiTransactionBlockResponse;
    const tx = new Transaction();
    // number random with range 0-99
    // const randomNum = Math.floor(Math.random() * 100);

    // number random
    const randomNum = Math.random();

    const hero = tx.moveCall({
      target: `${ENV.PACKAGE_ID}::hero::new_hero`,
      arguments: [
        tx.pure.string("Hero #" + randomNum.toString().slice(2, 9)),
        tx.pure.u64(10),
        tx.object(ENV.HEROES_REGISTRY_ID),
      ],
      typeArguments: [],
    });
    const weapon = tx.moveCall({
      target: `${ENV.PACKAGE_ID}::hero::new_weapon`,
      arguments: [tx.pure.string("My Weapon!"), tx.pure.u64(100)],
      typeArguments: [],
    });
    tx.moveCall({
      target: `${ENV.PACKAGE_ID}::hero::equip_weapon`,
      arguments: [hero, weapon],
      typeArguments: [],
    });

    const signer = getSigner({ secretKey: ENV.USER_SECRET_KEY });
    const address = getAddress({ secretKey: ENV.USER_SECRET_KEY });
    const addressFromSinger = signer.getPublicKey().toSuiAddress();

    tx.transferObjects([hero], address);

    return suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
  };
