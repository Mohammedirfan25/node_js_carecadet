import PathPricelist from "./pathPricelist.schema.js";
export default {
    fileConfirmation,
    getPathInfoByProvider
}

async function fileConfirmation(body){
    const findFilePath = await PathPricelist.findOne({ providerID: body.providerID,organizationID:body.orgID,filePath:body.filename });
  
      if(findFilePath){
          await PathPricelist.findOneAndUpdate(
              { providerID: body.providerID,organizationID:body.orgID,filePath:body.filename },
              {
                  $set:{
                     
                      status:"verified",
                      updatedBy:"Admin",
                      updatedDate: new Date(),
                  }
                 
              }
          );
          return { message: 'Successfully verified' };
      } else {
          return {message:"file not exist"}
      }
  
  }

async function getPathInfoByProvider(body){
    const Organisationid = body.OrganizationID;
    const ProviderID=body.providerID
    console.log(Organisationid,ProviderID)
    if (ProviderID&&Organisationid) {
        console.log("check")
      const PathPricelistDetails = await PathPricelist.aggregate([
        { $match: { providerID: ProviderID, organizationID: Organisationid } },
        {
          $project: {
           status:1,
           filePath:1,
           providerID:1,
           organizationID:1,
            createdBy: 1,
            createdDate: 1,
            updatedBy: 1,
            updatedDate: 1,
          },
        },
      ]);
      console.log(PathPricelistDetails)
      return { data: PathPricelistDetails };
    } else {
      throw Error("files not available");
    }
}

