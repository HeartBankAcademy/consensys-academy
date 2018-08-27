var Collectables = artifacts.require('Collectables');

contract('Collectables', function(accounts) {
    const owner = accounts[0];
    const alice = accounts[1];
    const bob = accounts[2];
    const category = "Coles Little Shop";

    it("should allow owner to add a category", async() => {
        const collectables = await Collectables.deployed();
        await collectables.addCategory(category, {from: owner});
        const categoryCount = await collectables.getNumberOfCategories();
        assert.equal(categoryCount, 1, 'Category count should be incremented');
        const result = await collectables.categories(0);
        assert.equal(result, category, 'Category name should match');
    });

    it("should not allow a non owner to add category", async() => {
        const collectables = await Collectables.deployed();
        const newCategory = "Attack";
        try {
            await collectables.addCategory(newCategory, {from: alice});
        } catch(e) {
            const expected = "VM Exception while processing transaction: revert";
            assert.equal(e.message, expected, 'Extected error message match: ' + expected);          
        }
        const categoryCount = await collectables.getNumberOfCategories();
        assert.equal(categoryCount, 1, 'Category count should not be incremented');
        const result = await collectables.categories(0);
        assert.equal(result, category, 'Category name should be what owner added');       
    });

    it("should allow a user to register as a Collector", async() => {
        const collectables = await Collectables.deployed();
        const name = "Alice";

        await collectables.addCollector(name, {from: alice});
        
        const collector = await collectables.collectors(alice);
        // collector struct is returned as an array of elements in struct
        assert.equal(collector[0], name, 'Name should match');
    });

    it("should allow a Collector to add a Collection", async() => {
        const collectables = await Collectables.deployed();
        const name = "Little Shop of Alice";
        const tags = "#LittleShop, #Coles"
        await collectables.addCollection(name, tags, category, {from: alice});
        const collector = await collectables.collectors(alice);
        //console.log(collector);

        const count = await collectables.getNumberOfCollectionsForCategory(category);
        assert.equal(count, 1, 'Should be 1 collection for category');

        const collection = await collectables.getCollectionDetailsByIndex(category, 0);

        assert.equal(collection[0], name, 'Collection name should match');
        assert.equal(collection[1], alice, 'Collection owner should be Alice');
        assert.equal(collection[2], tags, 'Collection tags should match');  
        assert.equal(collection[3].toString(10), 0, 'Collection item count should be 0');  
    });

    it("should not allow a non collector to add a collection", async() => {
        const collectables = await Collectables.deployed();
        const name = "Little Shop of Bob";
        const tags = "#LittleShop, #Coles"
        try {
            await collectables.addCollection(name, tags, category, {from: bob});
        } catch (e) {
            const expected = "VM Exception while processing transaction: revert";
            assert.equal(e.message, expected, 'Extected error message match: ' + expected);
        }
        const count = await collectables.getNumberOfCollectionsForCategory(category);
        assert.equal(count, 1, 'Should still be 1 collection for category');
    });

    const vegemiteHash = "0x7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89";

    it("should allow a collector to add an item to a collection", async() => {
        const collectables = await Collectables.deployed();
        const itemName = "Vegemite";
        const value = web3.toWei(100, "finney");
        await collectables.addItem(category, 0, itemName, vegemiteHash, value, true, {from: alice});

        const item = await collectables.getItem(category, 0, itemName);
        assert.equal(item[0].toString(16), vegemiteHash, 'Item ipfsHash should match');
        assert.equal(item[1].toString(10), value, 'Item value should match');
        assert.equal(item[2].toString(), 'true', 'Item swappable should be true');
        
        const collection = await collectables.getCollectionDetailsByIndex(category, 0);
        assert.equal(collection[3].toString(10), 1, 'Collection item count should be 1');  

    });

    it("should not allow a non collector to add an item to a collection", async() => {
        const collectables = await Collectables.deployed();
        const itemName = "Attack";
        const ipfsHash = "0xff5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89";
        const value = web3.toWei(1, "finney");
        try {
            await collectables.addItem(category, 0, itemName, ipfsHash, value, true, {from: bob});
        } catch (e) {
            const expected = "VM Exception while processing transaction: revert";
            assert.equal(e.message, expected, 'Extected error message match: ' + expected);
        }
      
        const collection = await collectables.getCollectionDetailsByIndex(category, 0);
        assert.equal(collection[3].toString(10), 1, 'Collection item count should still be 1');  

    });

    it("should allow a collector to remove an item from a collection", async() => {
        const collectables = await Collectables.deployed();
        const itemName = "RemoveMe";
        const ipfsHash = "0x6e5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89";
        const value = web3.toWei(10, "finney");
        // add it first and make sure its there
        await collectables.addItem(category, 0, itemName, ipfsHash, value, true, {from: alice});
        const item = await collectables.getItem(category, 0, itemName);
        assert.equal(item[0].toString(16), ipfsHash, 'Item ipfsHash should match');
        
        const collection = await collectables.getCollectionDetailsByIndex(category, 0);
        assert.equal(collection[3].toString(10), 2, 'Collection item count should be 2');  

        // now try to remove it
        await collectables.removeItem(category, 0, itemName, {from: alice});
        const collAfter = await collectables.getCollectionDetailsByIndex(category, 0);
        assert.equal(collAfter[3].toString(10), 1, 'Collection item count should be back to 1');  

    });

    it("should allow a collector to propose swapping an item with another collector", async() => {
        // first register another collector
        const collectables = await Collectables.deployed();
        const name = "Bob";
        await collectables.addCollector(name, {from: bob});
        console.log("added bob as collector");
        // now add a collection
        const collectionName = "Little Shop of Bob";
        const tags = "#LittleShop, #Coles"
        await collectables.addCollection(collectionName, tags, category, {from: bob});
        console.log("added collection for bob");
        // now add an item
        const itemName = "Eggs";
        const ipfsHash = "0x4b5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89";
        const value = web3.toWei(100, "finney");
        await collectables.addItem(category, 1, itemName, ipfsHash, value, true, {from: bob});
        console.log("added item for Bobs collection");
        // now propose swap, for ipfs address just reuse item hash for test
        const index = [1, 0];
        const itemNameFor = "Vegemite";
        var bobBalanceBefore = await web3.eth.getBalance(bob).toNumber();
        console.log("Bobs balance before: " + bobBalanceBefore);

        var eventEmitted = false;
        var event = collectables.ProposalSent();
        var swapIndex = 99;
        await event.watch((err, res) => {
            swapIndex = res.args.index.toString(10);
            eventEmitted = true;
        });

        await collectables.addProposedSwap(category, index, alice, ipfsHash, itemNameFor, itemName, {from: bob, value: value});

        var bobBalanceAfter = await web3.eth.getBalance(bob).toNumber();
        console.log("Bobs balance after: " + bobBalanceAfter);
        // see if alice got it
        const swap = await collectables.getProposedSwap(category, 0, 0, {from: alice});
        console.log("Checked if alice got it");
     
        // get bob sent proposals too
        const sent = await collectables.isProposalSent(category, 1, ipfsHash, {from: bob});
        console.log("Checked if bob got it");

        assert.equal(sent.toString(), 'true', 'swap proposal item should be marked as sent');

        assert.equal(eventEmitted, true, 'adding a proposed swap should emit a ProposalSent event');
        assert.equal(swapIndex.toString(10), 0, 'Swap Index should be 0');
        assert.equal(swap[0], bob, 'Proposed swapper should be bob');
        assert.equal(swap[1].toString(16), ipfsHash, 'postal address of swapper should match hash');
        assert.equal(swap[2].toString(16), vegemiteHash, 'swap for item hash should be vegemite' );
        assert.equal(swap[3].toString(16), ipfsHash, 'swap with item hash should match');
        assert.equal(swap[4].toString(10), value, 'swap item value should match');
        assert.isBelow(bobBalanceAfter, bobBalanceBefore - value, "bob's balance should be reduced by more than the price of the item (including gas costs)"); 

    });

    // Reject Swap test: assumes propose swap test run first
    it("should allow a collector to reject swap propsal", async() => {
        const collectables = await Collectables.deployed();

        await collectables.rejectSwap(category, 0, 0, {from: alice});
        try {
            console.log("Swap rejected, now checking that deleted");
            const swap = await collectables.getProposedSwap(category, 0, 0, {from: alice});
        } catch (e) {
            const expected = "VM Exception while processing transaction: revert";
            assert.equal(e.message, expected, 'Extected error message match: ' + expected);
        }

        // now check bobs sent list is false
        console.log("now checking bob knows");
        const ipfsHash = "0x4b5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89";       
        const sent = await collectables.isProposalSent(category, 1, ipfsHash, {from: bob});
        assert.equal(sent.toString(), 'false', 'swap proposal item should be marked as not sent');

        // now check bob has redeemable escrow
        console.log("now checking bobs redeemable funds");
        const value = web3.toWei(100, "finney");
        const redeemable = await collectables.getRedeemableEscrow({from: bob});
        assert(redeemable.toString(10), value, 'redeemable escrow should match value sent');
    });

    it("should allow a collector to confirm swap proposal", async() => {
        const collectables = await Collectables.deployed();

        // bob will have to propose swap again
        const index = [1, 0];
        const itemName = "Eggs";
        const itemNameFor = "Vegemite";
        const ipfsSwapWithHash = "0x4b5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89";
        const ipfsBobsAddrHash = "0x7e5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89";
        const value = web3.toWei(100, "finney");
        await collectables.addProposedSwap(category, index, alice, ipfsBobsAddrHash, itemNameFor, itemName, {from: bob, value: value});
        console.log("proposed swap");

        // now let alice check she got it
        const swap = await collectables.getProposedSwap(category, 0, 0, {from: alice});
        console.log("alice got swap");
        assert.equal(swap[0], bob, 'Proposed swapper should be bob');
        assert.equal(swap[1].toString(16), ipfsBobsAddrHash, 'postal address of swapper should match hash');
        assert.equal(swap[2].toString(16), vegemiteHash, 'swap for item hash should be vegemite' );
        assert.equal(swap[3].toString(16), ipfsSwapWithHash, 'swap with item hash should match');
        assert.equal(swap[4].toString(10), value, 'swap item value should match');
        
        // now alice can confirm it
        const ipfsAliceAddrHash = "0x665a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89";
        var eventEmitted = false;
        var event = collectables.ConfirmationSent();
        var swapIndex = 99;
        var eventSender;
        var eventReceiver;
        var aliceBalanceBefore = await web3.eth.getBalance(alice).toNumber();
     
        console.log("Alice's balance before: " + aliceBalanceBefore);

        await event.watch((err, res) => {
            swapIndex = res.args.index.toString(10);
            eventSender = res.args.sender;
            eventReceiver = res.args.receiver;
            eventEmitted = true;
        });
 
        await collectables.confirmSwap(category, 0, 0, ipfsAliceAddrHash, {from: alice, value: value});

        var aliceBalanceAfter = await web3.eth.getBalance(alice).toNumber();
        console.log("Alice's balance after: " + aliceBalanceAfter);
        assert.equal(eventEmitted, true, 'confirming a swap should emit a ConfirmationSent event');
        assert.equal(swapIndex.toString(10), 0, 'Swap Index should be 0');
        assert.equal(eventSender, alice, "Event sender should be alice");
        assert.equal(eventReceiver, bob, "Event sender should be bob");
        assert.isBelow(aliceBalanceAfter, aliceBalanceBefore - value, "Alice's balance should be reduced by more than the price of the item (including gas costs)"); 
       
    });

    // retrieve confirmed swap details test: assumes confirm swap test has been run
    it("should allow a Collector to receive details of confirmed swap", async() => {
        const collectables = await Collectables.deployed();

        const ipfsSwapWithHash = "0x4b5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89";
        const ipfsBobsAddrHash = "0x7e5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89";
        const ipfsAliceAddrHash = "0x665a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89";
        const value = web3.toWei(100, "finney");
 
        const swap = await collectables.getConfirmedSwapDetails(category, 0, 0, {from: alice}); 
        //cs.proposal.swapper, cs.proposal.swapperAddr, cs.proposal.swapFor.ipfsHash, cs.proposal.swapWith.ipfsHash,
        //cs.proposal.swapWith.value, cs.swappeeAddr, uint8(cs.status)
        assert.equal(swap[0], bob, 'Proposed swapper should be bob');
        assert.equal(swap[1].toString(16), ipfsBobsAddrHash, 'postal address of swapper should match hash');
        assert.equal(swap[2].toString(16), vegemiteHash, 'swap for item hash should be vegemite' );
        assert.equal(swap[3].toString(16), ipfsSwapWithHash, 'swap with item hash should match');
        assert.equal(swap[4].toString(10), value, 'swap item value should match');
        assert.equal(swap[5].toString(16), ipfsAliceAddrHash, 'postal address of swappee should match hash');
        assert.isAbove(swap[6].toNumber(10), 0, "Status should be at least confirmed");
    
    });

    it("should allow a Collector with a confirmed swap to add tracking reference details to swap", async() => {
        const collectables = await Collectables.deployed();
        const swappeeReference = "A12345";
        const swapRefArg = web3.fromAscii(swappeeReference);

        const swapCount = await collectables.getNumberOfConfirmedSwaps({from: alice});
        console.log("Swap Count is: " + swapCount);
        console.log("Ref in hex is is: " + swapRefArg);

        await collectables.addTrackingReference(category, 0, swapRefArg, 0, {from: alice});
        console.log("added reference now try to retireve using other collector");

        const track = await collectables.getConfirmedSwapTrackingDetails(category, 1, 0, {from: bob});
        //cs.swapperTrack.received, cs.swapperTrack.reference, cs.swappeeTrack.received, cs.swappeeTrack.reference
        assert.isFalse(track[0], "Swapper has not received item yet");
        assert.equal(web3.toAscii(track[1]).replace(/\u0000/g, ''), "", "Swapper Reference should be empty");
        assert.isFalse(track[2], "Swappee has not received item yet");       
        assert.equal(web3.toAscii(track[3]).replace(/\u0000/g, ''), swappeeReference, "Swappee Reference should match");
        
    });

    it("should allow a Collector with a confirmed swap to mark that they have received their item", async() => {
        const collectables = await Collectables.deployed();
        // bob adds tracking ref for item he sent and says he has item
        const swapperReference = "B12345";
        const swappeeReference = "A12345";

        await collectables.addTrackingReference(category, 1, web3.fromAscii(swapperReference), 0, {from: bob});
        console.log("added reference now mark received");

        await collectables.markItemReceived(category, 1, 0, {from: bob});
        console.log("bob mark received");

        const track = await collectables.getConfirmedSwapTrackingDetails(category, 0, 0, {from: alice});
        console.log(track);
        assert.isTrue(track[0], "Swapper has received item");
        assert.equal(web3.toAscii(track[1]).replace(/\u0000/g, ''), swapperReference, "Swapper Reference should match");
        assert.isFalse(track[2], "Swappee has not received item yet");       
        assert.equal(web3.toAscii(track[3]).replace(/\u0000/g, ''), swappeeReference, "Swappee Reference should match");
        
        //alice receives item and status changes
        await collectables.markItemReceived(category, 0, 0, {from: alice});
        console.log("alice mark received");
      
        const bobTrack = await collectables.getConfirmedSwapTrackingDetails(category, 1, 0, {from: bob});
        console.log(bobTrack);  
        assert.isFalse(bobTrack[0], "Once swap completed track should be deleted");
        const swap = await collectables.getConfirmedSwapDetails(category, 0, 0, {from: alice}); 
        assert.equal(swap[6].toNumber(10), 3, "Status should be Completed");
     
    });

    it("should allow a Collector to redeem escrow and thus take redeemable funds from contract", async() => {
        const collectables = await Collectables.deployed();
        var bobBalanceBefore = await web3.eth.getBalance(bob).toNumber();
        console.log("Bobs balance before: " + bobBalanceBefore);

        const collect = await collectables.getRedeemableEscrow({from: bob});
        console.log("Bob's redeemable funds: " + collect);

        if (collect > 0) {
            await collectables.takeRedeemableEscrow({from: bob});
        }
        var bobBalanceAfter = await web3.eth.getBalance(bob).toNumber();
        console.log("Bobs balance after: " + bobBalanceAfter);
    });

});
