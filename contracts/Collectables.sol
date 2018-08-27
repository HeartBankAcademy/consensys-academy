pragma solidity ^0.4.24;

import "./Ownable.sol";

contract Collectables is Ownable {

    event ProposalSent(uint index, address sender, address receiver);
    event ConfirmationSent(uint index, address sender, address receiver);

    struct Collection {
        address collector;
        string name;
        string tags;
        //bool exists;
        uint8 itemCount;  // TODO enforce limit 255
        mapping (uint => Item) items;  // item key is index (makes map look like an array)
        //bytes32[] itemNames; // used for items key
        mapping (string => uint) itemNames; // maps names to index in items (used for uniqueness checking)
    }

    struct Item {
        string name;
        bytes32 ipfsHash;
        uint value; // in wei
        //uint index; // back to itemNames array
        bool swappable;
        bool exists;
    }

    // store collections by Category
    // for efficiency Category name limit will be 32 characters
    //bytes32[] public categories;
    string[] public categories;
    mapping (string => Collection[]) categoryCollectionsMap; // cant make public with string as key
    // to get list of category names get number of categories then call getter per index
    // to get list of collections per category get number of collections and then call getter // ccm[catName][i].name
    // to get my collection for category use MyCollections list for index into collections list (per category)

    // a collector may have many collections but only 1 in each category (for now)
    struct Collector {
        string name;
        // category (key) collection index (val)
        mapping (string => uint) myCollections;
        ProposedSwap[] proposedSwaps; // sent to me
        mapping (bytes32 => bool) sentProposals; // ipfsHash is key
        uint[] myConfirmedSwaps;  // list of indexes into confirmedSwap List
        uint redeemableEscrow; // amount of funds in wei that Collector is allowed to withdraw 
    }

    mapping (address => Collector) public collectors;

    enum SwapStatus { Proposed, Confirmed, InProgress, Completed, Failed }
    //enum SwapId {Swappee, Swapper}

    struct ProposedSwap {
        address swapper;
        bytes32 swapperAddr;  // stored in ipfs including email 
        Item swapFor;
        Item swapWith;
    }

    struct ConfirmedSwap {
        ProposedSwap proposal;
        bytes32 swappeeAddr; // stored in ipfs including email
        uint confirmedTimestamp;
        SwapStatus status;
    }

    struct SwapTracker {
        bool received;
        bool disputed;
        bytes32 reference;
        uint referenceTimestamp;
        //TODO Next Version: bytes32 postalService;
    }

    ConfirmedSwap[] confirmedSwaps;
    mapping (uint => address[2]) swapOwners;  // swappee=0, swapper=1
    mapping (uint => SwapTracker[2]) swapTracker; // TODO if this works try combining in swapOwners

    modifier onlyCollector() {
        require(isCollector(msg.sender), "Must register to perform this operation");
        _;
    }

    modifier onlyCollectionOwner(string category, uint index) {
        require(categoryCollectionsMap[category][index].collector == msg.sender, "must own collection");
        _;
    } 

    /**
    * @dev Allows the current owner to add a Category
    * @param _category New category string, maximum length 30 to allow fit into 1 storage slot
    */
    function addCategory(string _category) external onlyOwner {
        require(bytes(_category).length > 0 && bytes(_category).length < 31, "category must be populated and max len 30");
        categories.push(_category);
    }

    /**
    * @dev get array limit and then call getter num times to fetch all categories
    */
    function getNumberOfCategories() external view returns (uint num) {
        return categories.length;
    }
 
    // can be called internally and externally hence public
    function isCollector(address addr) public view returns (bool isIndeed) {
        if(bytes(collectors[addr].name).length == 0) return false;
        return true;
    }

    /**
    * @dev Allows the msg sender to register as a collector
    * @param _name name of collector
    */
    function addCollector(string _name) external {
        if(isCollector(msg.sender)) revert("Collector exists");
        require(bytes(_name).length > 0, "Name argument must be populated");
        collectors[msg.sender].name = _name;
    }

    function getRedeemableEscrow() external view onlyCollector returns (uint) {
        return collectors[msg.sender].redeemableEscrow;
    }

    /**
    * @dev Allows the Collector to add a collection
    * @param _name name of collection
    * @param _tags useful tags to search for collection
    * @param _category category that the collection will be added to
    */
    function addCollection(string _name, string _tags, string _category) external onlyCollector {
        require(bytes(_name).length > 0, "Name argument must be populated");
        require(bytes(_tags).length > 0, "Tags argument must be populated");
        require(bytes(_category).length > 0, "Category argument must be populated");
        // push returns new length
        //bytes32[] memory itemNames;
        Collection memory collection = Collection(msg.sender, _name, _tags, 0);
        collectors[msg.sender].myCollections[_category] = categoryCollectionsMap[_category].push(collection)-1;
    }

   /**
    * @dev Allows the caller to get the number of collections for a category
    * @param _category category name
    */
    function getNumberOfCollectionsForCategory(string _category) external view returns (uint num) {
        return categoryCollectionsMap[_category].length;
    }

    function getNumberOfConfirmedSwaps() external view onlyCollector returns (uint num) {
        return confirmedSwaps.length;
    }
    
    /**
    * @dev Allows the caller to get collection details: collection name, address of owner, and tags
    * @param _category category name
    * @param _index index of collection
    */
    function getCollectionDetailsByIndex(string _category, uint _index)
        external view returns (string name, address owner, string tags, uint8 count) {
        require(_index >= 0 && _index < categoryCollectionsMap[_category].length, "Index out of range");
        Collection memory c = categoryCollectionsMap[_category][_index];
        return (c.name, c.collector, c.tags, c.itemCount);
    }

   /**
    * @dev Allows a Collection Owner to add an item
    * @param _category category name
    * @param _index index of collection
    */
    // add item to collection, called externally only
    // to store ipfshash properly refer https://github.com/saurfang/ipfs-multihash-on-solidity
    function addItem(string _category, uint _index, string _name, bytes32 _ipfsHash, uint _value, bool _swappable) 
        external onlyCollectionOwner(_category, _index) {
    
        require(bytes(_name).length > 0, "Name argument length must be populated");
        uint itemIndex = categoryCollectionsMap[_category][_index].itemNames[_name];
        // as itemIndex can legitamely be 0 we have to also compare the strings
        require(
            itemIndex == 0 && !_compareStrings(categoryCollectionsMap[_category][_index].items[0].name,_name),
            "Item name should not be already in collection"
        );
        require(_ipfsHash.length == 32, "ipfshash length (without hashtype and length prefix) must be 32 bytes long");
        require(_value >= 0, "Cannot supply negative value");
        // two mappings items and itemNames
        uint length = ++categoryCollectionsMap[_category][_index].itemCount;
        categoryCollectionsMap[_category][_index].itemNames[_name] = length - 1;
        categoryCollectionsMap[_category][_index].items[length - 1] = Item(_name, _ipfsHash, _value, _swappable, true);
    }

    function _compareStrings (string a, string b) private pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }

    /**
    * @dev Allows the Collection Owner to remove an Item from collection
    * @param _category category name
    * @param _index index of collection
    * @param _name item name
    */
    function removeItem(string _category, uint _index, string _name) external onlyCollectionOwner(_category, _index) {
        uint itemIndex = categoryCollectionsMap[_category][_index].itemNames[_name];
        require(
            categoryCollectionsMap[_category][_index].items[itemIndex].exists,
            "Item name must be in collection"
        );
        // first delete from map but get name index first
        //uint indexToRemove = categoryCollectionsMap[category][index].items[name].index;
        delete categoryCollectionsMap[_category][_index].items[itemIndex];
        // now delete from item names map
        delete categoryCollectionsMap[_category][_index].itemNames[_name];
        // decrement itemCount
        categoryCollectionsMap[_category][_index].itemCount--;
    }

   /**
    * @dev Allows the caller to get the details for an Item from collection: ipfsHash, item value, swappable flag
    * @param _category category name
    * @param _index index of collection
    * @param _name item name
    */    
    function getItem(string _category, uint _index, string _name) external view returns (bytes32 ipfsHash, uint value, bool swappable) {
        require(_index >= 0 && _index < categoryCollectionsMap[_category].length, "Index out of range"); // 0 < 0 handles bad category name
        uint itemIndex = categoryCollectionsMap[_category][_index].itemNames[_name];
        Item memory item = categoryCollectionsMap[_category][_index].items[itemIndex];
        return (item.ipfsHash, item.value, item.swappable); 
    }

    /*  TODO do we really need this function
    function getItemNames(string _category, uint _index) external view returns (string[] names) {
        require(_index >= 0 && _index < categoryCollectionsMap[_category].length, "Index out of range");
        return categoryCollectionsMap[_category][_index].itemNames;
    }*/

   /* Design Decision: Postal Address was stored in ipfs to avoid storage, gas and stack issues and use strength of js for address validation and allow dApp
    * to use public key of other party to encrypt address then store it in ipfs and pass here 
    * also leave it to dApp to get swappable items for msg.sender up to given value (contract will validate if proposed swap is swappable) 
    * (get all items in msg.sender collection for that category) and then filter out non swappable
    * also pass index args as 1 fix sized array to avoid stack issue
    */
    /**
    * @dev Allows the Collector to add a Proposed Swap request, this function is payable pass value of item swapping with
    * @param _category category name
    * @param _index 2 elements: index of collection followed by index of collection that contains requested item
    * @param _swappee address of swappee (owner of requested item)
    * @param _ipfsSwapAddr ipfs Hash of Proposers Postal Address 
    * @param _itemNameFor item name to swap for
    * @param _itemNameWith item name to swap with
    */
    function addProposedSwap(
        string _category, uint[2] _index, address _swappee, bytes32 _ipfsSwapAddr, string _itemNameFor, string _itemNameWith) 
        external payable onlyCollectionOwner(_category, _index[0]) {
   
        require(bytes(collectors[_swappee].name).length > 0, "Invalid address");
        require(bytes(_itemNameFor).length > 0, "Must supply item name for swap");
        require(bytes(_itemNameWith).length > 0, "Must supply item name to swap");
        require(_index[1] < categoryCollectionsMap[_category].length, "Invalid index for Collection to get swap from");
        require(_ipfsSwapAddr.length == 32, "ipfsSwapAddr length (without hashtype and length prefix) must be 32 bytes long");

        /*uint itemIndex = categoryCollectionsMap[_category][_collIndexFrom].itemNames[_itemNameFor];
        Item memory swapFor = categoryCollectionsMap[_category][_collIndexFrom].items[itemIndex];
        */
        Item memory swapFor = _findSwap(_category, _itemNameFor, _index[1]);
        require(swapFor.ipfsHash.length > 0, "Cannot find item to swap for");
        require(swapFor.swappable, "Collection owner doesn't want to swap this item");
        require(msg.value == swapFor.value, "Only send in ether that equals value of item swapped for");

        /*itemIndex = categoryCollectionsMap[_category][_index].itemNames[_itemNameWith];
        Item memory swapWith = categoryCollectionsMap[_category][_index].items[itemIndex];
        */
        Item memory swapWith = _findSwap(_category, _itemNameWith, _index[0]);
        require(swapWith.ipfsHash.length > 0, "Cannot find item to swap with");
        require(!collectors[msg.sender].sentProposals[swapWith.ipfsHash], "Cannot propose swap for item that already has been proposed");
 
        ProposedSwap memory swap = ProposedSwap(msg.sender, _ipfsSwapAddr, swapFor, swapWith);
        uint swapIndex = collectors[_swappee].proposedSwaps.push(swap) - 1;
        collectors[msg.sender].sentProposals[swapWith.ipfsHash] = true;
        emit ProposalSent(swapIndex, msg.sender, _swappee);
    }

    function _findSwap(string _category, string _itemName, uint _collIdx) private view returns (Item swapItem) {
        uint itemIndex = categoryCollectionsMap[_category][_collIdx].itemNames[_itemName];
        swapItem = categoryCollectionsMap[_category][_collIdx].items[itemIndex];
        return swapItem;
    }
    
    /**
    * @dev Allows the Collection Owner of proposed swap requested item to get the details of a Proposed Swap: swapper addr, swapper postal address, 
    *      hash of item to swap for,
    *      hash of item to swap with, value of item to swap with
    * @param _category category name
    * @param _index index of collection (of caller)
    * @param _swapIndex index of proposal swap array
    */ 
    function getProposedSwap(string _category, uint _index, uint _swapIndex) 
        external view onlyCollectionOwner(_category, _index) 
        returns (address swapper, bytes32 swapperAddr, bytes32 ipfsHashFor, bytes32 ipfsHashWith, uint valueWith) {
        
        require(_swapIndex >= 0 && _swapIndex < collectors[msg.sender].proposedSwaps.length, "Invalid swap index");
        ProposedSwap memory ps = collectors[msg.sender].proposedSwaps[_swapIndex];
        return (ps.swapper, ps.swapperAddr, ps.swapFor.ipfsHash, ps.swapWith.ipfsHash, ps.swapWith.value);
    }

   /**
    * @dev Allows the Collection Owner who sent a proposal to confirm proposal was sent
    * @param _category category name
    * @param _index index of collection (of caller)
    * @param _ipfsItem ipfs hash of item to swap with
    */ 
    function isProposalSent(string _category, uint _index, bytes32 _ipfsItem) external view onlyCollectionOwner(_category, _index) 
        returns (bool) {
        return collectors[msg.sender].sentProposals[_ipfsItem];
    }

    /**
    * @dev Allows the Collection Owner who received a proposal to reject proposal, dApp must refresh proposed swaps list after calling this
    * @param _category category name
    * @param _index index of collection (of caller)
    * @param _swapIndex index of proposal swap array
     */ 
    function rejectSwap(string _category, uint _index, uint _swapIndex) external onlyCollectionOwner(_category, _index) {
        require(_swapIndex >= 0 && _swapIndex < collectors[msg.sender].proposedSwaps.length, "Invalid swap index");
        ProposedSwap memory proposedSwap = collectors[msg.sender].proposedSwaps[_swapIndex];
        // refund escrow to proposer
        collectors[proposedSwap.swapper].redeemableEscrow += proposedSwap.swapFor.value;
        // notify swapper and remove from my list
        collectors[proposedSwap.swapper].sentProposals[proposedSwap.swapWith.ipfsHash] = false;
        _deleteProposedSwap(_swapIndex);
        //TODO should we emit event
    }

    /*
     * Efficient function to delete a proposed swap
     * rather than use delete which keeps the same length and initialises deleted element struct to empty vals, 
     * simply move the last item in array to the item to remove element and reduce length by 1, saving gas
     * works since we dont care abaout array order
     */
    function _deleteProposedSwap(uint _indexToRemove) private {
        uint len = collectors[msg.sender].proposedSwaps.length;
        ProposedSwap memory lastSwap = collectors[msg.sender].proposedSwaps[len - 1];
        collectors[msg.sender].proposedSwaps[_indexToRemove] = lastSwap;
        collectors[msg.sender].proposedSwaps.length--;
    }

    /**
    * @dev Allows the Collection Owner who received a proposal to confirm swap, thus creating a confirmed swap in storage, 
    *      payable function, send value of swap item (requested for)
    * @param _category category name
    * @param _index index of collection (of caller)
    * @param _psidx index of proposal swap array
    * @param _ipfsPostal hash of postal address to send proposed swap item to
     */ 
    function confirmSwap(string _category, uint _index, uint _psidx, bytes32 _ipfsPostal)
        external payable onlyCollectionOwner(_category, _index) {
        require(_psidx >= 0 && _psidx < collectors[msg.sender].proposedSwaps.length, "Invalid swap index");
        require(msg.value == collectors[msg.sender].proposedSwaps[_psidx].swapFor.value, "Must only send ether that matches value of swap item");
        require(_ipfsPostal.length == 32, "_ipfsPostal length (without hashtype and length prefix) must be 32 bytes long");

        ConfirmedSwap memory swap = ConfirmedSwap(collectors[msg.sender].proposedSwaps[_psidx], _ipfsPostal, now, SwapStatus.Confirmed);
        uint csidx = confirmedSwaps.push(swap) - 1;
        swapOwners[csidx][0] = msg.sender;
        collectors[msg.sender].myConfirmedSwaps.push(csidx);
        // add swap to swappers list also
        swapOwners[csidx][1] = collectors[msg.sender].proposedSwaps[_psidx].swapper;
        collectors[swapOwners[csidx][1]].myConfirmedSwaps.push(csidx);
        emit ConfirmationSent(csidx, msg.sender, swapOwners[csidx][1]);
    }

    /**
    * @dev Allows the Collector to add a tracking reference to a confirmed swap, function will distinguish if swapper or swappee
    * @param _category name of category
    * @param _index index of callers collection, will be validated that caller owns collection
    * @param _reference tracking reference, max chars 30 so that the reference will only occupy 1 storage slot
    * @param _csidx index of confirmed swap array
    */
    function addTrackingReference(string _category, uint _index, bytes32 _reference, uint _csidx) 
        external onlyCollectionOwner(_category, _index) {
        require(swapOwners[_csidx][0] == msg.sender || swapOwners[_csidx][1] == msg.sender, "Must be involved with swap");
        //TODO fix, this causes revert: require(_reference.length < 31, "Must provide reference up to 30 chars long");

        // if swapper update swapper ref else swappee ref
        uint trackIndex = 0;
        if(swapOwners[_csidx][1] == msg.sender) {
            trackIndex = 1;
        } 
        swapTracker[_csidx][trackIndex].reference = _reference;
        swapTracker[_csidx][trackIndex].referenceTimestamp = now;
     
        confirmedSwaps[_csidx].status = SwapStatus.InProgress;  
    }

    /**
    * @dev Allows the Collector to mark that they have received an item in confirmed swap, function will distinguish if swapper or swappee
    *      (and if both parties received set status to Completed and allocate funds for collection)
    * @param _category name of category
    * @param _index index of callers collection, will be validated that caller owns collection
    * @param _csidx index of confirmed swap array
    */
    function markItemReceived(string _category, uint _index, uint _csidx) external onlyCollectionOwner(_category, _index) {
        require(swapOwners[_csidx][0] == msg.sender || swapOwners[_csidx][1] == msg.sender, "Must be involved with swap");

        // if swapper update swapper ref else swappee ref, swappee=0, swapper=1
        uint trackIndex = 0;
        if(swapOwners[_csidx][1] == msg.sender) {
            trackIndex = 1;
        } 
        swapTracker[_csidx][trackIndex].received = true;

        if(swapTracker[_csidx][0].received == true && swapTracker[_csidx][1].received == true) {
            confirmedSwaps[_csidx].status = SwapStatus.Completed;
            //Release funds to both parties
            collectors[swapOwners[_csidx][0]].redeemableEscrow += confirmedSwaps[_csidx].proposal.swapFor.value;
            collectors[swapOwners[_csidx][1]].redeemableEscrow += confirmedSwaps[_csidx].proposal.swapFor.value;
            // TODO in future should we delete completed swaps to save space and reduce potential overflows
            // and length of myConfirmedSwaps index array  (will most likely save gas in getting data, test this)
            // we could have owner function that cleans up completed swaps after x days
            // also delete associated mappings, lets start with tracker
            delete swapTracker[_csidx];
        }    
    }

   /**
    * @dev Allows the Collection owner to get details of confirmed swap (that is in their list)
    * @param _category name of category
    * @param _index index of callers collection, will be validated that caller owns collection
    * @param _csidx index of confirmed swap array
    */
    function getConfirmedSwapDetails(string _category, uint _index, uint _csidx) 
        external view onlyCollectionOwner(_category, _index)
        returns (address, bytes32, bytes32, bytes32, uint, bytes32, uint8) {
        require(swapOwners[_csidx][0] == msg.sender || swapOwners[_csidx][1] == msg.sender, "Must be involved with swap");
        ConfirmedSwap memory cs = confirmedSwaps[_csidx];
        return (cs.proposal.swapper, cs.proposal.swapperAddr, cs.proposal.swapFor.ipfsHash, cs.proposal.swapWith.ipfsHash,
            cs.proposal.swapWith.value, cs.swappeeAddr, uint8(cs.status)); 
    }

    /**
    * @dev Allows the Collection owner to get tracking details of confirmed swap (that is in their list), 
    *      only callable once one party has entered tracking detrails
    * @param _category name of category
    * @param _index index of callers collection, will be validated that caller owns collection
    * @param _csidx index of confirmed swap array
    */
    function getConfirmedSwapTrackingDetails(string _category, uint _index, uint _csidx) 
        external view onlyCollectionOwner(_category, _index)
        returns (bool, bytes32, bool, bytes32) {
        require(swapOwners[_csidx][0] == msg.sender || swapOwners[_csidx][1] == msg.sender, "Must be involved with swap");
        //TODO fix this causes unexpected revert
        //ConfirmedSwap memory cs = confirmedSwaps[_csidx];
        //require(cs.status >= SwapStatus.InProgress && cs.status != SwapStatus.Completed, "Invalid swap status");
        SwapTracker[2] memory track = swapTracker[_csidx];
        return (track[1].received, track[1].reference, track[0].received, track[0].reference);
    }

    //TODO check safety checklist, common bugs, attacks and best practises
    /**
    * @dev Allows a Collecter to take Redeemable Escrow equal to the value that is redeeemable (contract may take small fee in future for ipfs costs)
    */
    function takeRedeemableEscrow() external onlyCollector {
        uint redeemable = collectors[msg.sender].redeemableEscrow;
        require(redeemable > 0 && redeemable < address(this).balance, "No funds redeemable");
        collectors[msg.sender].redeemableEscrow = 0;
        msg.sender.transfer(redeemable);
    }

}