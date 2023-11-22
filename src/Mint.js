import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import "./App.css";
import NFTABI from "./NFTABI.json";
import Footer from "./Footer";
import { Box, Flex, Image, Text, useToast } from "@chakra-ui/react";
import { Link } from "react-router-dom";

const contractAddress = "0x6055189140d4930Aa1a5E01F3FF954ac43FAd1f2";

function Mint() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const price = 0.1; // TODO Cambiar precio al precio del mint.
  const [isMetamaskInstalled, setIsMetamaskInstalled] = useState(false);
  const toast = useToast();
  const [totalMinted, setTotalMinted] = useState(0);
  const [maxSupply, setMaxSupply] = useState(0);

  const updateNFTData = useCallback(async () => {
    try {
      const total = await contract.totalSupply();
      const max = await contract.MAX_SUPPLY();
      setTotalMinted(total.toNumber());
      setMaxSupply(max.toNumber());
    } catch (error) {
      console.error('Error fetching data from the contract:', error);
    }
}, [contract]);

useEffect(() => {
  updateNFTData();
  const interval = setInterval(() => {
    updateNFTData();
  }, 1000); // 1000ms = 1 segundo

  return () => clearInterval(interval);
}, [updateNFTData]);  

  const reconnectWalletOnLoad = useCallback(async () => {
    if (window.ethereum) {
      try {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);

        const signer = web3Provider.getSigner();
        const accounts = await signer.getAddress();
        setAccount(accounts);

        const nftContract = new ethers.Contract(
          contractAddress,
          NFTABI,
          signer
        );
        setContract(nftContract);
      } catch (error) {
        console.error("Error reconnecting to MetaMask:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (account) {
      reconnectWalletOnLoad();
    }
  }, [account, reconnectWalletOnLoad]);

  const connectWalletHandler = async () => {
    if (isMetamaskInstalled) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
      }
    }
  };


  useEffect(() => {
    if (window.ethereum) {
      setIsMetamaskInstalled(true);
      const checkIfWalletIsConnected = async () => {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            reconnectWalletOnLoad();
          }
        } catch (error) {
          console.error("Error checking for connected accounts:", error);
        }
      };

      checkIfWalletIsConnected();
    }
  }, [reconnectWalletOnLoad]);

  useEffect(() => {
    if (window.ethereum) {
      setIsMetamaskInstalled(true);
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  
  const mintNftHandler = async () => {
    if (!account){
      connectWalletHandler();
      return;
    }
    if (contract) {
      try {
        const gasPrice = await provider.getGasPrice();
        const gasLimit = 300000;
        const precioNFT = ethers.utils.parseEther(price.toString()); 

        const balance = await provider.getBalance(account);
        if (balance.lt(precioNFT)) {
          toast({
            title: "Not enough funds!",
            description: "Not enough funds to purchase the NFT.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        try {
          const tx = await contract.buyNFT({
            value: precioNFT,
            gasPrice: gasPrice.toHexString(),
            gasLimit: ethers.BigNumber.from(gasLimit),
          });
    
          const receipt = await tx.wait();
      
          if (receipt.status === 1) {
              updateNFTData();
              toast({
                title: "Congratulations!",
                description: "You successfully minted your NFT!",
                status: "success",
                duration: 5000,
                isClosable: true,
              });
          } else {
              toast({
                title: "Transaction Failed",
                description: "The transaction did not complete successfully.",
                status: "error",
                duration: 5000,
                isClosable: true,
              });
          }
      } catch (error) {
          console.error("Error during the transaction:", error);
          toast({
            title: "Transaction Error",
            description: "An error occurred during the transaction.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
      }      

      } catch (error) {
        console.error("Error Minting NFT:", error);
        

      }
    }
  };

  const formatAddress = (address) => {
    if (typeof address === 'string' && address.length >= 8) {
      return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
    }
    return '';
  };



  return (
    <Box
      height={"100vh"}
      width={"100%"}
      bgGradient={"linear(to-r, #6A82FB, #FC5C7D)"}
      position={"relative"}
      isolation={"isolate"}
      overflow={"hidden"}
      pb={14}
    >
      <Box
        background={"#000"}
        padding={{ md: "15px 32px" }}
        height={"85px"}
        display={"flex"}
        alignItems={"center"}
        justifyContent={"center"}
      >

        <Flex
          width={"100%"}
          alignItems={"center"}
          justifyContent={"space-between"}
        >
          <Box width={{ base: "100%", xl: "25%" }}>
            <Link to="/">
              <Flex alignItems={"center"} gap={"1"}>
                <Image src="./logo192.png" height="50px" />
              </Flex>
            </Link>
          </Box>

          <Box width={"50%"} display={{ base: "none", xl: "block" }}>
            <Flex
              gap={"44px"}
              justifyContent={"center"}
              className="initial-navbar"
            >

            </Flex>
          </Box>

          <Box
            width={{ base: "100%", xl: "25%" }}
            display={"flex"}
            alignItems={"center"}
            justifyContent={"end"}
          >
            {account ? (
              <Box
                style={{
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "#4DCC95",
                  border: "1px solid black", 
                  fontWeight: "bolder",
                  boxShadow: "0px 1px 0px 0px #FFF",
                  borderRadius: "10px", 
                  padding: "10px 20px",
                  cursor: "pointer",
                }}
                onClick={() => navigator.clipboard.writeText(account)}
              >
                <Text fontSize={{ base: "13px", md: "15px" }}>
                  {formatAddress(account)}
                </Text>
              </Box>
            ) : (
              <Box
                width={"200px"}
                bg={
                  "#4DCC95"
                }
                height={{ base: "45px", md: "50px" }}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                boxShadow={" 0px 2px 0px 0px #FFF"}
                fontWeight={"bolder"}
                borderRadius={"9px"}
                cursor={"pointer"}
                onClick={connectWalletHandler}
                sx={{
                  transition: "opacity 0.3s ease-in-out",
                  "&:hover": {
                    opacity: 0.75,
                  },
                }}
              >
                <Text
                  color={"#fff"}
                  fontSize={{ base: "13px", md: "15px" }}
                  fontWeight={"bolder"}
                >
                  Connect to MetaMask
                </Text>
              </Box>
            )}
          </Box>
        </Flex>
      </Box>

      <Flex
        height={"90%"}
        alignItems={"end"}
        justifyContent={"space-between"}
        flexDirection={"column"}
      >

        <Box
          bg={"#000"}
          borderRadius={"20px"}
          boxShadow={"2px 2px 2px 0px rgba(255, 255, 255, 0.25)"}
          mt={"20"}
          pb={{ base: "4", md: "14" }}
          pt={"50px"}
          px={{ base: "22px", md: "42px" }}
          width={"95%"}
          maxW={"730px"}
          mx={"auto"}
        >
          <Flex alignItems={"center"} justifyContent={"center"}>
            <Image 
              src="./logo512.png"
              height={"230px"} 
            />
          </Flex>


          <Flex
            justifyContent={"center"}
            alignItems={"center"}
            px={4}
            gap={"2"}
            mt={"20px"}
            flexWrap={{ base: "wrap", md: "nowrap" }}
          >
            <Box
              width={"70%"}
              display={{ base: "flex", md: "block" }}
              alignItems={"center"}
              justifyContent={"center"}
              gap={4}
            >
              <Text
                fontSize={{ base: "15px", md: "25px" }}
                color={"#fff"}
                fontWeight={"800"}
                letterSpacing={"3.84px"}
                textAlign={"center"}
              >
                {maxSupply - totalMinted}/{maxSupply}
              </Text>

              <Flex alignItems={"center"} justifyContent={"center"} gap={"10px"} mt={"10px"}>
                <Text 
                color={"#fff"} 
                fontSize={{ base: "20px", md: "30px" }}
                textAlign={"center"}>
                  {price} ETH
                </Text>
              </Flex>
            </Box>

          </Flex>

          <Box
            mt={"30px"}
            width={"100%"}
            bg={
              "#4DCC95"
            }
            height={{ base: "45px", md: "58px" }}
            display={"flex"}
            alignItems={"center"}
            justifyContent={"center"}
            boxShadow={" 0px 2px 0px 0px #FFF"}
            borderRadius={"9px"}
            cursor={"pointer"}
            sx={{
              transition: "opacity 0.3s ease-in-out",
              '&:hover': {
                opacity: 0.75
              }
            }}
            onClick={mintNftHandler}
          >
            <Text
              color={"#fff"}
              fontSize={{ base: "15px", md: "19px" }}
              fontWeight={"800"}
              letterSpacing={"3.84px"}
            >
              MINT
            </Text>
          </Box>
        </Box>

        <Footer />
      </Flex>
    </Box>
  );
}

export default Mint;
