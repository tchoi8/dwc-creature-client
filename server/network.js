import request from 'request'
import { getOtherGardenAddress } from "./config"

class Network {
  constructor() { }
  async sendCreatureToGarden(gardenName, creatureId) {
    const destination = getOtherGardenAddress(gardenName)
    // console.log('Destination is: ', destination)
    return new Promise((resolve, reject) => {
      request.post(`${destination}/hello`, {
        form: { creature: creatureId }
      }, (err, res, body) => {
        if (err) {
          console.error('Error in passing creature to garden: ', gardenName)
          // console.dir(err)
          reject()
        } else {
          console.log('Successfully sent creature to garden: ', gardenName)
          resolve()
        }
      })
    })
  }
}

export default new Network()