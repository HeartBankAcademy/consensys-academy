# Consensys Academy 2018 Final Project of Simon Abela
# Avoiding Common Attacks

## Reentrancy Attack
Contract uses Withdrawal pattern so Collectors can claim redeemable funds rather than sending
takeRedeemableEscrow function sets redeemable value to 0 before transfer is called
takeRedeemableEscrow uses transfer rather than call.send to prevent any external code from being executed

###Cross-function Race Conditions
again takeRedeemableEscrow uses transfer rather than call.send to prevent any external code from being executed
contract avoids calling external functions

## Timestamp Dependence Attack
Contract does use timestamps but they follow the 30 second rule

## Integer Overflow and Underflow Attack
Contract only takes escrow equal to the value of the item being swapped with so a collectors balance should not reach limit
If Attacker was proposer and adds an item with huge value then they will have to send same funds for proposal thus NO incentive to attack
Proposal receiver would also have to send same funds to confirm swap and NO incentive for them to do so - they would reject swap

### Underflow
Contract uses container data structures pattern for material dynamic arrays

## DoS with (Unexpected) revert
On payable functions Contract only changes state upon checking all requires (that could cause revert)
Also Contract uses withdrawal pattern

## DoS with Block Gas Limit
Contract uses Withdrawal pattern and only allows 1 caller at a time to withdraw redeemable funds 

## General DOS attacks
Contract uses Restricting Access pattern to avoid DOS attacks
Contract uses Mappings where possible and avoids For Loops alltogether
Contract implements rule where a collector may have many collections but only 1 in each category
Contract relies on IPFS to store data of significant size such as images

## Forcibly Sending Ether to a Contract
Contract does not implement logic based on the contracts balance and does not implement a fallback function with important logic



