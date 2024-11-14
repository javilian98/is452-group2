## Step By Step Guide

Inside client folder:
1. duplicate .env.sample and rename to .env

2. paste your thirdweb client ID to an environment variable called VITE_CLIENT_ID

3. in your thirdweb dashboard, go to 'Contracts' tab > copy the contract address of your deployed smart contract, then paste the address to an environment variable called VITE_DEPLOYED_CONTRACT_ADDRESS

4. in your terminal pointing to client directory, run npm i to install dependencies 

5. run npm run dev to run the application
