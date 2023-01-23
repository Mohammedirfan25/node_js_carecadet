import { Router } from "express";
import FacilityService from "./facility.service.js";
import ResObject from '../../core/util/res-object.js';

const router = Router();

export default router;

router.get('/getFacilityList',getFacilityList);
router.get('/getFacilityByProvider',getFacilityByProvider);
router.post('/createFacility',createFacility);
router.put('/updateFacility',updateFacility);
router.delete('/deleteFacility',deleteFacility);

function getFacilityList(req,res,next) {
    FacilityService.getFacilityList().then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}

function getFacilityByProvider(req,res,next) {
    const providerID = req.query.providerID;
    FacilityService.getFacilityByProvider(providerID).then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}

function createFacility(req,res,next) {
    const body = req.body ?? {};
    FacilityService.createFacility(body).then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}

function updateFacility(req,res,next) {
    const body = req.body ?? {};
 FacilityService.updateFacility(body).then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}

function deleteFacility(req,res,next) {
    const facilityID = req.query.facilityID ?? null;
   FacilityService.deleteFacility(facilityID).then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}