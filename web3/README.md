## Step-by-step set-up guide

Inside web3 folder:

1. duplicate .env.sample and rename to .env
2. paste your thirdweb secret key to an environment variable called SECRET_KEY
3. paste your alchemy api key (create your alchemy account: https://www.alchemy.com/) to an environment variable called ALCHEMY_API_KEY.

4. Ignore CLIENT_ID (not in used inside web3 folder)
5. in your terminal pointing to web3 directory, run npm i to install dependencies
6. run the command to deploy the smartcontract: npx thirdweb@latest deploy -k <thirdweb secret key value>, replace <thirdweb secret key value> with your actual thirdweb secret key that you copied earlier
