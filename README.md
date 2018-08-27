# Consensys Academy 2018 Final Project of Simon Abela
## Collectables dApp - for cataloging and swapping
### User Stories
#### Admin (Contract Owner) creates Category

#### Register collector
If ether addr not in collectors list then *Register as Collector* link is displayed on Home page
Once link clicked then collector asked for Name and added to collector list in contract

#### Collector adds collection
dApp recognises collector and presents Collector home page
Collector sees list of Categories and can distinguish those with or without their collections 
Collector clicks Category without Collection and then *Add New Collection Button*
Collector may only have 1 colleciton per Category to minimise DOS attack vector (thus if they click on a category with a colleciton the add new collection button is disabled)
Collector is asked for
- Tags *enter as many #tags as required for others to find your collection*
- Name *name of collection (not personal name)*

#### Collector adds Item
Collector clicks on Category
Collector clicks on existing collection
Collecter is presented with a list of items in that collection
Collector clicks *Add new item* (provided they own Collection)
Collector is asked for
- Item name
- Item photo (to be stored in IPFS)
- Item Value (optional)
- click checkbox if *willing to swap*

#### Collector removes Item
As for *add item* story except collector clicks *Remove Item* and item is removed from collection and picture from IPFS

#### User browses Categories
From home page click on *Browse All Callections*
User (can also be collector) is presented with list of Categories
User clicks on Category
User is presented with list of collections for that category
User clicks on Collection
User is presented with list of items in that Collection

#### Collector proposes swap
Collector follows browse category story
Items available for swap should have a swap link
Collector clicks on swap link
Collector is then presented with a list of their own swappable items in same Category of same or less value
Collector selects items for proposed swap (up to value of item being swapped for)  (first version can only select 1)
Collector enters following info that will be encrypted in blockchain using swapees ethereum address
- Name
- Address (use PO box or Click and Collect for privacy)
- email address
Collector then clicks *Request Swap* and the other Collector will see it in their *Proposed Swaps list*
Collector is presented with Transaction in Metamask *or similar* with Ether value of swap for escrow (chance to cancel proposal)


#### Collector Views Proposed Swaps list
Collector should be able to see a Proposed Swaps list on the home page
Collector then can click on a swap to see swap details
- proposed swap item
- name, address, and email address of swapper (decrypted using their private key)
Collector can then click on confirm or reject swap
If confirmed
- Collector is asked for following info that will be encrypted in blockchain using swappers ethereum address
  - Name
  - Address (use PO box or Click and Collect for privacy)
  - email address
- Collector is presented with Transaction in Metamask *or similar* with Ether value of swap for escrow (second chance to reject)
- Swapper will see the swap in their *Confirmed Swaps* list
If rejected
- Swapper escrow is released (swapper must collect from contract - add story)

#### Confirmed Swaps and tracking
Both Collectors should be able to see a Confimrmed swap list on the home page
Collector should then send item by registered post
Collector can then click on confirmed swap and enter a tracking reference number (will not get escrow back if not completed)

#### Receive item
When item is received Collector should go to the Confirmed swap list, click on the swap and press received button. Swap is marked as received for that party by contract

#### Swap is completed
When both Collectors have clicked on *Received* then the Swap is considered *Completed* and the escrow for both parties will be released less a small fee for the platform (to pay web and ipfs server costs)
Any funds claimable shall be viewable from home page
Collector can then claim escrow from the home page link and a transaction initiated from contract to claimant

#### Disputes
Either party can initiate a dispute from the Confirmed swaps list upon the following conditions
- they have entered a tracking number or the other party has marked the item as received
- they have still not received their item(s) and 
  - 7 days have passed since the other party has entered the tracking number 
  - OR the other party has not entered a tracking number and 3 days have passed
If other party has entered a tracking number then dApp will check tracking via post API and if still in progress close the dispute
If other party has NOT entered a tracking number and has received their swap or the swap is considered delivered by Post API and they have not lodged a dispute then the escrow will be released to the disputor but NOT to the other party
If other party has entered a tracking number and the swap is considered delivered by the Post API (but Disputor still hasnt marked received) then either party can lodge an insurance claim with the postal agency; in any case the swap is considered *failed* and neither party will be able to use platform to swap again until resolved and escrow will not be released to either party
The other party will eventually get escrow back once the disputor has received item
Otherwise escrow will continue to be held by contract
Do a flow chart


## Setup
checkout from github

### To Run
ng serve 

The app is now served on localhost:4200 (if you have metamask running it will interact with that else use ganache-cli)
### To Test
start up ganache-cli from another terminal in project dir
in same project dir run
truffle compile
truffle migrate
truffle test



