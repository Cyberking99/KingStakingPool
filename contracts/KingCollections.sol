// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

contract KingCollections {
    mapping(uint256 => mapping(address => uint256)) private _balances;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    
    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );
    
    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );
    
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);
    
    string private _baseURI;

    constructor(string memory baseURI_) {
        _baseURI = baseURI_;
    }

    function setApprovalForAll(address operator, bool approved) public {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    function isApprovedForAll(address account, address operator) public view returns (bool) {
        return _operatorApprovals[account][operator];
    }
    
    function balanceOf(address account, uint256 id) public view returns (uint256) {
        require(account != address(0), "Error(ERC1155): Balance query for the zero address");
        return _balances[id][account];
    }
    
    function balanceOfBatch(address[] memory accounts, uint256[] memory ids)
        public
        view
        returns (uint256[] memory)
    {
        require(accounts.length == ids.length, "Error(ERC1155): Accounts and ids length does not match");

        uint256[] memory batchBalances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }

        return batchBalances;
    }
    
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount
    ) public {
        require(
            from == msg.sender || isApprovedForAll(from, msg.sender),
            "Error(ERC1155): You are not owner or not approved to transfer"
        );
        require(to != address(0), "Error(ERC1155): Transfer to the zero address not allowed");

        address operator = msg.sender;

        _balances[id][from] -= amount;
        _balances[id][to] += amount;

        emit TransferSingle(operator, from, to, id, amount);
    }
    
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public {
        require(
            from == msg.sender || isApprovedForAll(from, msg.sender),
            "Error(ERC1155): Caller is not owner nor approved"
        );
        require(to != address(0), "Error(ERC1155): Transfer to the zero address is not allowed");
        require(ids.length == amounts.length, "Error(ERC1155): IDs and amounts length does not match");

        address operator = msg.sender;

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            _balances[id][from] -= amount;
            _balances[id][to] += amount;
        }

        emit TransferBatch(operator, from, to, ids, amounts);
    }
    
    function mint(
        address to,
        uint256 id,
        uint256 amount
    ) public {
        require(to != address(0), "Error(ERC1155): Minting to the zero address not allowed");

        address operator = msg.sender;

        _balances[id][to] += amount;

        emit TransferSingle(operator, address(0), to, id, amount);
    }
    
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public {
        require(to != address(0), "Error(ERC1155): Minting to the zero address not allowed");
        require(ids.length == amounts.length, "Error(ERC1155): IDs and amounts length does not match");

        address operator = msg.sender;

        for (uint256 i = 0; i < ids.length; ++i) {
            _balances[ids[i]][to] += amounts[i];
        }

        emit TransferBatch(operator, address(0), to, ids, amounts);
    }
    
    function uri(uint256 _id) public view returns (string memory) {
        return string(abi.encodePacked(_baseURI, uint2str(_id)));
    }
    
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bstr[k] = bytes1(temp);
            _i /= 10;
        }
        return string(bstr);
    }
}
