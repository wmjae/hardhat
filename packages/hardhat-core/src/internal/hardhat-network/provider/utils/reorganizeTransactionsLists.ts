import { BN } from "ethereumjs-util";

import { InternalError } from "../errors";
import { SenderTransactions } from "../PoolState";

import { retrieveNonce } from "./retrieveNonce";

export function reorganizeTransactionsLists(
  pending: SenderTransactions,
  queued: SenderTransactions
) {
  let newPending = pending;
  let newQueued = queued.sortBy(retrieveNonce, (l, r) => l.cmp(r));

  let executableNonce: BN;

  if (pending.last() === undefined) {
    throw new InternalError("Pending list cannot be empty");
  }

  executableNonce = retrieveNonce(pending.last()).addn(1);

  let movedCount = 0;
  newQueued.forEach((queuedTx) => {
    const queuedTxNonce = retrieveNonce(queuedTx);
    if (executableNonce.eq(queuedTxNonce)) {
      newPending = newPending.push(queuedTx);
      executableNonce.iaddn(1);
      movedCount++;
    } else {
      return false; // stops iteration
    }
  });
  newQueued = newQueued.skip(movedCount);

  return {
    executableNonce,
    newPending,
    newQueued,
  };
}
