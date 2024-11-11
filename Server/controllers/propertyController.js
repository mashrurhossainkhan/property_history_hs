const { Client } = require('@hubspot/api-client');
//

async function createProperties(accessToken) {
  const hubspotClient = new Client({ accessToken });

  const propertiesToCreate = [
    {
      hidden: false,
      displayOrder: -1,
      description: "This property is created to store the quality of the phone number",
      label: "PF-Phone Number Quality",
      type: "string",
      formField: false,
      groupName: "contactinformation",
      name: "pf_phone_number_quality_14082001",
      fieldType: "text",
    },
    {
      "hidden": false,
      "displayOrder": -1,
      "description": "This property is created to store the formatted phone number",
      "label": "PF-Formatted Phone Number",
      "type": "string", // Set to "string" for phone numbers
      "formField": false,
      "groupName": "contactinformation",
      "name": "pf_formatted_phone_number_14082001",
      "fieldType": "phonenumber" // Set to "phone_number" for proper phone number formatting
    }    
  ];

  const objectType = "contacts";

  try {
    for (const property of propertiesToCreate) {
      try {
        const apiResponse = await hubspotClient.crm.properties.coreApi.create(objectType, property);
        //console.log(`Property ${property.name} created:`, JSON.stringify(apiResponse, null, 2));
      } catch (e) {
        if (e.code === 409) {
          console.log(`Property ${property.name} already exists.`);
        } else {
          console.error(`Error creating property ${property.name}:`, e.message);
        }
      }
    }
  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

module.exports = {createProperties};
