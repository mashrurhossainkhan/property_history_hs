const Package = require("../model/packages.model");
const express = require('express');
const logger = require('../utils/logger'); // Add logger

let insert_Package_Details = async (inputData) => {
    //later update if authenticate
    try {
        const { packageName, price, monthlyLimit, duration } = input;
      
        let packageInfo = new Package(
            {
                packageName,
                price,
                monthlyLimit,
                duration 
            }
        )
        await packageInfo.save();
           return res.status(201).json({ packageInfo });
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
}

let update_Package_Details = async (inputData) => {
    const { packageName, updateData } = inputData;
    try {
        const updatedPackage = await Package.findOneAndUpdate(
            { packageName: packageName },
            updateData,  //updateData is an object containing the new data
            {
                new: true, // Return the updated document
                upsert: true, // Insert the document if it does not exist
            }
        );
        // console.log('Document upserted in Mongo:', updatedPackage);
        return res.status(200).json({ updateData });
    } catch (error) {
        console.error('Error inserting document:', error);
        return res.status(400).json({ error });
    }
}


exports.get_all_packages = async (req, res) => {
    const packages = await Package.find().sort({ index: 1 });
        if (!packages) {
            return res.status(404).json({ error: 'packages not found' });
        }
        // logger.info("Get All Packges:" + JSON.stringify(packages));
    res.json(packages);
  }

  //returning packages to paymentController 
  exports.all_packages = async (req, res) => {
    const packages = await Package.find();
        if (!packages) {
            return res.status(404).json({ error: 'User not found' });
        }
        // logger.info("All Packges (for PaymentController):" + JSON.stringify(packages));
    return packages;
  }


exports.get_all_packages_by_id = async (req, res) => {
    const packages = await Package.findOne({_id: req.params.id});
        if (!packages) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.setHeader('Content-Type', 'text/html');
        if(packages.packageName == 'Custom'){
            res.write(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Hubxpert App</title>
                <style>
                    body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    background-color: #f1f1f1;
                    }
                    header {
                    background-color: #004080;
                    color: white;
                    text-align: center;
                    padding: 20px 0;
                    }
                    header .logo {
                    width: 200px;
                    margin-bottom: 10px;
                    }
                    header h1 {
                    margin: 0;
                    font-size: 2em;
                    }
                    main {
                    flex: 1;
                    padding: 20px;
                    text-align: center;
                    }
                    .description {
                    max-width: 600px;
                    margin: 0 auto;
                    }
                    .description h2 {
                    font-size: 2em;
                    color: #004080;
                    }
                    .description p {
                    font-size: 1.2em;
                    color: #333;
                    }
                    footer {
                    background-color: #f1f1f1;
                    text-align: center;
                    padding: 10px 0;
                    }
                    footer p {
                    margin: 0;
                    color: #555;
                    }
                    footer a {
                    color: #004080;
                    text-decoration: none;
                    }
                    .success {
                    background-color: #64bae2;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                    margin-bottom: 20px;
                    }
                    .success h2 {
                    color: #fff;
                    margin-top: 0;
                    }
                    .success p {
                    color: #fff;
                    }
                    .install-button {
                    padding: 10px 20px;
                    font-size: 20px;
                    font-weight: bold;
                    background-color: #f2750e;
                    border: none;
                    border-radius: 5px;
                    color: #fff;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                    text-decoration: none;
                    }
                    .install-button:hover {
                    transform: scale(1.1);
                    }
                </style>
                </head>
                <body>
                <header>
                    <a href="https://www.hubxpert.com/"><img src="https://static.wixstatic.com/media/2369f3_e7a786f139044881883babb752b00212~mv2.png/v1/fill/w_388,h_154,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/2369f3_e7a786f139044881883babb752b00212~mv2.png" alt="Hubxpert Logo" class="logo"></a>
                    <h1>Data Formatter App By HubXpert</h1>
                </header>
                <main>
                    <h1>Custom user</h1>
                    <h2>About Our App</h2>
                    <p>Welcome to the Hubxpert App, your go-to solution for seamless HubSpot integration and data formatting. Our app provides custom workflow actions to format data, making your HubSpot experience more efficient and effective.</p>
                    </section>

            `);

            res.write(`
                </main>
                <footer>
                    <p>&copy; 2024 <a href="https://www.hubxpert.com/">Hubxpert</a>. All rights reserved.</p>
                </footer>
                </body>
                </html>
            `);
            res.end();
        }
        else{
            const packagePrice = (packages.price) *100;
            res.write(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Hubxpert App</title>
                <style>
                    body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    background-color: #f1f1f1;
                    }
                    header {
                    background-color: #004080;
                    color: white;
                    text-align: center;
                    padding: 20px 0;
                    }
                    header .logo {
                    width: 200px;
                    margin-bottom: 10px;
                    }
                    header h1 {
                    margin: 0;
                    font-size: 2em;
                    }
                    main {
                    flex: 1;
                    padding: 20px;
                    text-align: center;
                    }
                    .description {
                    max-width: 600px;
                    margin: 0 auto;
                    }
                    .description h2 {
                    font-size: 2em;
                    color: #004080;
                    }
                    .description p {
                    font-size: 1.2em;
                    color: #333;
                    }
                    footer {
                    background-color: #f1f1f1;
                    text-align: center;
                    padding: 10px 0;
                    }
                    footer p {
                    margin: 0;
                    color: #555;
                    }
                    footer a {
                    color: #004080;
                    text-decoration: none;
                    }
                    .success {
                    background-color: #64bae2;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                    margin-bottom: 20px;
                    }
                    .success h2 {
                    color: #fff;
                    margin-top: 0;
                    }
                    .success p {
                    color: #fff;
                    }
                    .install-button {
                    padding: 10px 20px;
                    font-size: 20px;
                    font-weight: bold;
                    background-color: #f2750e;
                    border: none;
                    border-radius: 5px;
                    color: #fff;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                    text-decoration: none;
                    }
                    .install-button:hover {
                    transform: scale(1.1);
                    }
                </style>
                </head>
                <body>
                <header>
                    <a href="https://www.hubxpert.com/"><img src="https://static.wixstatic.com/media/2369f3_e7a786f139044881883babb752b00212~mv2.png/v1/fill/w_388,h_154,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/2369f3_e7a786f139044881883babb752b00212~mv2.png" alt="Hubxpert Logo" class="logo"></a>
                    <h1>Data Formatter App By HubXpert</h1>
                </header>
                <main>
                    <section class="description">
                       
                        <section class="description">
                        <form id="checkout-form" action="/charge/create-checkout-session" method="POST">
                        <input type="hidden" name="id" value="${req.params.id}" id="checkout-id">
                        <button type="submit">Checkout</button>
                        </form>
                       </section>
                    <h2>About Our App</h2>
                    <p>Welcome to the Hubxpert App, your go-to solution for seamless HubSpot integration and data formatting. Our app provides custom workflow actions to format data, making your HubSpot experience more efficient and effective.</p>
                    </section>

            `);

            res.write(`
                </main>
                <footer>
                    <p>&copy; 2024 <a href="https://www.hubxpert.com/">Hubxpert</a>. All rights reserved.</p>
                </footer>
                </body>
                </html>
            `);
            res.end();
};
 
  }

  
