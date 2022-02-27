const cloudinary = require('cloudinary').v2;
const Conf = require('conf');
const { imagePlatform } = require('../../../utils');

const configstore = new Conf();
const keys = configstore.get(imagePlatform);

async function uploadToCloudinary(image) {
  if (!keys) {
    throw new Error('In order to process Data URI images, the image needs to be uploaded to Cloudinary'
    + ' to obtain a valid URL, then the image is deleted after the upload. If you wish to do that, please'
    + ' create a Cloudinary account and obtain the keys necessary. You can also skip uploading the image with the'
    + ' article by passing the option --ignore-image');
  }
  cloudinary.config(keys);
  return cloudinary.uploader.upload(image, { return_delete_token: true });
}

module.exports = uploadToCloudinary;
