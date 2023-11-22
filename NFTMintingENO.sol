// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTENO is ERC721Enumerable, Ownable {
    uint256 public MAX_SUPPLY;
    uint256 public NFTPrice = 100000000000000000;
    uint256 private _tokenId = 1;
    string private _baseTokenURI;
    address public ownerWallet;  
    bool public isPaused;

    event Received(address sender, uint amount);
    event Fallback(address sender, uint amount);
    event NFTPurchased(address buyer, uint256 tokenId);

    constructor(
        address _ownerWallet,
        uint256 _MAX_SUPPLY
    ) 
    ERC721("NFT ENO", "NFTENO") {
        ownerWallet = _ownerWallet;
        MAX_SUPPLY = _MAX_SUPPLY;
    }

    function buyNFT() public payable whenNotPaused {
        require(msg.value == (NFTPrice), "Payment not enough");
        require(_tokenId <= MAX_SUPPLY, "Max supply reached");

        payable(ownerWallet).transfer(NFTPrice);

        mint(msg.sender);
        emit NFTPurchased(msg.sender, _tokenId);
    }

    function setNftPrice(uint256 newPrice) public onlyOwner {
        NFTPrice = newPrice;
    }

    modifier whenNotPaused() {
        require(!isPaused, "Contract is paused");
        _;
    }

    function mint(address to) private {
        _mint(to, _tokenId);
	    _tokenId++;
    }

    function setBaseURI(string memory baseTokenURI) public onlyOwner {
        _baseTokenURI = baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        
        if (bytes(_baseTokenURI).length > 0) {
            // Construyendo la URI sin el ".json" al final
            return string(abi.encodePacked(
                _baseTokenURI, 
                Strings.toString(tokenId), 
                ".json"
            ));
        }
        
        return "";
    }

    function pauseContract() external onlyOwner {
        isPaused = true;
    }

    function unpauseContract() external onlyOwner {
        isPaused = false;
    }

    // Función receive para manejar transacciones de ETH directas
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    // Función fallback para llamadas de datos no reconocidas
    fallback() external payable {
        emit Fallback(msg.sender, msg.value);
    }

    // Función para retirar ETH del contrato
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");

        payable(owner()).transfer(balance);
    }

}