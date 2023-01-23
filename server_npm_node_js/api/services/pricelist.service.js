import Pricelist from "./pricelist.schema.js";
import path from "path";
import fs from "fs";
// import csvjson from "csvtojson";
import pkg from "json-2-csv";
const { json2csv } = pkg;

import csvjson from "csvjson";
const __dirname = path.resolve(path.dirname(""));

import nodemailer from "nodemailer";
import PathPricelist from "../pathPricelist/pathPricelist.schema.js";

export default {
  uploadPricelist,
  publishPricelist,
  getPriceList,
  updatePricelist,
  deletePricelist,
  getPriceListbyFacility,
  bulkUpdate,
  bulkDelete,
  // getPriceListone,
  getPriceListbyService,
  createService,
};

const useremail = "carecadet.demo@gmail.com";
const emailpass = "iiwcefbinvtgqjyc";

const transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  auth: {
    user: useremail,
    pass: emailpass,
  },
  port: 587,
  secure: false,
});
// var date = new Date();
// var mail = {
//     "id":ProviderDetails.providerID,
//     "created":date.toDateString()
// }
// const token_mail_verification = jwt.sign(mail,config.jet_secret_mail,{ expiresIn: '1d' })
// var url = "http://localhost:5200+confirm?id=+token_mail_verification";

async function sendConfirmationEmail(emailData, orgID, filename) {
  // console.log("Check");

  const mailOptions = await transport.sendMail(
    {
      from: "carecadet.demo@gmail.com",
      to: "carecadet.demo@gmail.com",
      subject: "Please confirm your account",
      html: `<h1>PriceList Confirmation</h1>
          <h2>Hello Admin,</h2>
          <p>Please Validate and Verify the uploaded pricelist from <br/> User ID : ${emailData.userID},<br/> User Name : ${emailData.userName} ,<br/> User Email : ${emailData.email}</p>
          <a href=http://localhost:5200/pathPricelist/verify?filename=/uploads/${filename}&providerID=${emailData.userID}&orgID=${orgID}><button style="color: white;background-color: blue;padding:1rem; font-size: 15px;border:none ; border-radius:10px">Verify</button></a>
          </div>`,
      attachments: [
        {
          filename: filename,
          path: __dirname + "/uploads/" + filename,
        },
      ],
    }
    // function (error, info) {
    //   console.log("sentMail returned!");
    //   if (error) {
    //     console.log("Error!!!!!", error);
    //     sendMessage="suerr"
    //   } else {
    //     console.log("Email sent:" + info.response);
    //     sendMessage="suerr"
    //   }
    // }
  );
  if (mailOptions) {
    return { message: "success" };
  } else {
    throw Error("mail not sent");
  }
  // .catch(err => console.log(err));
  // return {message: sendMessage}
}

async function pathConfirmPricelist(emailData, orgID, filename) {
  console.log("checkPath");
  const pathPriceListDetails = new PathPricelist();
  pathPriceListDetails.status = "Pending";
  pathPriceListDetails.filePath = "/uploads/" + filename;
  pathPriceListDetails.providerName = emailData.userName;
  pathPriceListDetails.providerID = emailData.userID;
  pathPriceListDetails.organizationID = orgID;
  pathPriceListDetails.createdBy = emailData.userName;
  pathPriceListDetails.createdDate = new Date();
  await pathPriceListDetails.save();
  return { message: "success" };
}

//****************************************************create&update&delete********************** */

async function uploadPricelist(file) {
  const filedata = file.csv;
  if (filedata.length !== 0) {
    var finalCSV = [];
    for (let i = 0; i < filedata.length; i++) {
      console.log(filedata[i].FacilityNPI,filedata[i].Organisationid)
      const findService = await Pricelist.findOne({
        FacilityNPI: filedata[i].FacilityNPI,
        Organisationid: filedata[i].Organisationid,
        DiagnosisTestorServiceName: filedata[i].DiagnosisTestorServiceName,
      });
      if (findService) {
        console.log(findService,"checkFind")
        finalCSV.push(filedata[i].DiagnosisTestorServiceName);
      }
    }
    console.log(finalCSV.length,"checklength")
    if (finalCSV.length !== 0) {
      throw Error(`${finalCSV} already exists`);
    } else {
      const csvData = csvjson.toCSV(filedata, {
        headers: "key",
      });
      const filename = Date.now() + "_" + file.name;
      let uploadPath = __dirname + "/uploads/" + filename;

      fs.writeFile(uploadPath, csvData, (err) => {
        if (err) console.error(err);
        else {
          console.log("Ok");
        }
      });
      const pathConfirmation = await pathConfirmPricelist(
        file.emailData,
        file.organizationID,
        filename
      );
      if (pathConfirmation.message === "success") {
        const mailConfrimation = await sendConfirmationEmail(
          file.emailData,
          file.organizationID,
          filename
        );
        if (mailConfrimation.message === "success") {
          return { message: "Successfully sent your request to admin" };
        } else {
          throw Error("mail not sent");
        }
      } else {
        throw Error("Something Wrong");
      }
    }
} else {
    throw Error("Invalid data");
  }
}

async function getPriceList() {
  const PriceList = await Pricelist.aggregate([
    {
      $project: {
        SNo: 1,
        ServiceCode: 1,
        DiagnosisTestorServiceName: 1,
        Organisationid: 1,
        OrganisationPrices: 1,
        FacilityNPI: 1,
        FacilityName: 1,
        FacilityPrices: 1,
        createdBy: 1,
        createdDate: 1,
        updatedBy: 1,
        updatedDate: 1,
      },
    },
  ]);
  return { data: PriceList };
}

async function publishPricelist(file) {
  const originaldata = file.csv;
  var finalPublish = [];
  for (let i = 0; i < originaldata.length; i++) {
    const facprice = {
      ...originaldata[i],
      ["FacilityPrices"]:
        originaldata[i].FacilityPrices === "" || null || undefined || 0
          ? originaldata[i].OrganisationPrices
          : originaldata[i].FacilityPrices,
    };
    finalPublish.push(facprice);
  }

const createPricelist=await   Pricelist.create(finalPublish
//     , function (err, documents) {
//     if (err) throw err;
//   }
);
 if(createPricelist.length===0){
  throw Error("Not Create")
 }else{
  return {
    message:"Successfully Published"
  }
 }
}

async function bulkUpdate(body) {
  console.log("body ", body);
  if (Object.keys(body).length === 0) {
    throw Error("Invalid body parameter");
  }
  for (var item of body.PriceList) {
    await updatePricelist(item);
  }
}

async function updatePricelist(body) {
  console.log("body ", body);
  if (Object.keys(body).length === 0) {
    throw Error("Invalid body parameter");
  }
  const findPricelist = await Pricelist.findOne({
    _id: body._id,
    FacilityNPI: body.FacilityNPI,
    Organisationid: body.Organisationid,
    DiagnosisTestorServiceName: body.DiagnosisTestorServiceName,
  });
  if (findPricelist) {
    await Pricelist.findOneAndUpdate(
      {
        _id: body._id,
        FacilityNPI: body.FacilityNPI,
        Organisationid: body.Organisationid,
        DiagnosisTestorServiceName: body.DiagnosisTestorServiceName,
      },
      {
        SNo: body.SNo,
        ServiceCode: body.ServiceCode,
        DiagnosisTestorServiceName: body.DiagnosisTestorServiceName,
        Organisationid: body.Organisationid,
        OrganisationPrices: body.OrganisationPrices,
        FacilityNPI: body.FacilityNPI,
        FacilityName: body.FacilityName,
        FacilityPrices: body.FacilityPrices,
        createdBy: body.FacilityNPI,
        createdDate: body.createdDate,
        updatedBy: body.FacilityNPI,
        updatedDate: new Date(),
      }
    );
    return { message: "Successfully saved" };
  } else {
    throw Error("Service not found");
  }
}
async function bulkDelete(body) {
  console.log("body ", body);
  if (Object.keys(body).length === 0) {
    throw Error("Invalid body parameter");
  }
  for (var id of body.PriceList) {
    await deletePricelist(id);
  }
}
async function deletePricelist(id) {
  if (id) {
    await Pricelist.deleteOne({ _id: id });
    return { message: "successfully deleted" };
  } else {
    throw Error("Service not found");
  }
}

async function getPriceListbyFacility(body) {
  const FacilityNPI = body.facilityNPI;
  const Organisationid = body.Organisationid;
  if (FacilityNPI) {
    const PricelistDetails = await Pricelist.aggregate([
      { $match: { FacilityNPI: FacilityNPI, Organisationid: Organisationid } },
      {
        $project: {
          // SNo: 1,
          ServiceCode: 1,
          DiagnosisTestorServiceName: 1,
          Organisationid: 1,
          OrganisationPrices: 1,
          FacilityNPI: 1,
          FacilityName: 1,
          FacilityPrices: 1,
          createdBy: 1,
          createdDate: 1,
          updatedBy: 1,
          updatedDate: 1,
        },
      },
    ]);
    return { data: PricelistDetails };
  } else {
    throw Error("please provide facility npi");
  }
}

// async function getPriceListone() {
//   // const PriceList = await Pricelist.aggregate([
//   //   {
//   //     $project: {
//   //       SNo: 1,
//   //       ServiceCode: 1,
//   //       DiagnosisTestorServiceName: 1,
//   //       Organisationid: 1,
//   //       OrganisationPrices: 1,
//   //       FacilityNPI: 1,
//   //       FacilityPrices: 1,
//   //       createdBy: 1,
//   //       createdDate: 1,
//   //       updatedBy: 1,
//   //       updatedDate: 1,
//   //     },
//   //   },
//   // ]);
//   // return { data: PriceList };
//   // if (DiagnosisTestorServiceName) {
//   //   await Pricelist.unique({ DiagnosisTestorServiceName: DiagnosisTestorServiceName });
//   //   return { message: "successfully filtered" };

//   // }
//   // await Pricelist.aggregate([
//   const PriceList = Pricelist.find().distinct("DiagnosisTestorServiceName");
//   return { data: PriceList }
//   // console.log("checked", PriceList);
//   // ]);
// }

async function getPriceListbyService(body) {
  const DiagnosisTestorServiceName = body.DiagnosisTestorServiceName;
  const Organisationid = body.Organisationid;
  if (DiagnosisTestorServiceName) {
    const PricelistDetails = await Pricelist.aggregate([
      {
        $match: {
          DiagnosisTestorServiceName: DiagnosisTestorServiceName,
          Organisationid: Organisationid,
        },
      },
      {
        $project: {
          SNo: 1,
          ServiceCode: 1,
          DiagnosisTestorServiceName: 1,
          Organisationid: 1,
          OrganisationPrices: 1,
          FacilityNPI: 1,
          FacilityName: 1,
          FacilityPrices: 1,
          createdBy: 1,
          createdDate: 1,
          updatedBy: 1,
          updatedDate: 1,
        },
      },
    ]);
    return { data: PricelistDetails };
  } else {
    throw Error("please provide service");
  }
}

async function createService(body) {
  // Check the Body parameters( atleast one parameter should be there)
  console.log("body ", body);
  if (Object.keys(body).length === 0) {
    throw Error("Invalid body parameter");
  }
  // const findOrganization = await Organization.findOne({ providerID: body.providerID });
  // if(!findOrganization){

  const findPricelist = await Pricelist.findOne({
    FacilityNPI: body.FacilityNPI,
    Organisationid: body.Organisationid,
    DiagnosisTestorServiceName: body.DiagnosisTestorServiceName,
  });
  if (!findPricelist) {
    const pricelist = new Pricelist();
    (pricelist.Organisationid = body.Organisationid),
      (pricelist.ServiceCode = body.ServiceCode),
      (pricelist.DiagnosisTestorServiceName = body.DiagnosisTestorServiceName),
      (pricelist.OrganisationPrices = body.OrganisationPrices),
      (pricelist.FacilityNPI = body.FacilityNPI),
      (pricelist.FacilityName = body.FacilityName),
      (pricelist.FacilityPrices = body.FacilityPrices),
      // createdBy: body.FacilityNPI,
      // createdDate: body.createdDate,
      // updatedBy: body.FacilityNPI,
      // updatedDate: new Date(),
      await pricelist.save();
    return { message: "Successfully created" };
  } else {
    throw Error("Service already exists");
  }
}
