pragma solidity ^0.4.24;

import "oraclize-api/usingOraclize.sol";

contract LibraryDemo is usingOraclize {

    string public ETHAUD;
    mapping(bytes32=>bool) validIds;

    event LogConstructorInitiated(string nextStep);
    event LogPriceUpdated(string price);
    event LogNewOraclizeQuery(string description);

    constructor() public payable {
        emit LogConstructorInitiated("Constructor was initiated. Call 'updatePrice()' to send the Oraclize Query.");
    }

    function __callback(bytes32 myid, string result) public {
        if (!validIds[myid]) revert("Invalid id returned");
        if (msg.sender != oraclize_cbAddress()) revert("Cannot find oraclize address");
        ETHAUD = result;
        emit LogPriceUpdated(result);
    }

    function updatePrice() public payable {
        if (oraclize_getPrice("URL") > address(this).balance) {
            emit LogNewOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
        } else {
            emit LogNewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            bytes32 queryId = oraclize_query("URL", "json(https://api.gdax.com/products/ETH-AUD/ticker).price");
            validIds[queryId] = true;
        }
    }
}