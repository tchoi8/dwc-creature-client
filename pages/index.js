import React from 'react'
import Link from 'next/link'
import classnames from 'classnames'
import io from 'socket.io-client'
import Style from '../static/styles/main.less'
import Head from '../components/Head'
import Creature from '../components/Creature'
import server from '../config/server'

export default class Index extends React.Component {
  constructor(props) {
    super(props)
    this.onCreatureExit = this.onCreatureExit.bind(this)
    this.acquireCreature = this.acquireCreature.bind(this)
    this.onReceivedGardenInfo = this.onReceivedGardenInfo.bind(this)
    this.onVisibilityChange = this.onVisibilityChange.bind(this)

    this.state = {
      creatures: {},
      gardenConfig: {}
    }
  }

  get isVisible() {
    return (document.visibilityState == 'visible')
  }

  onVisibilityChange() {
    if (this.isVisible) {
      this.socketSetup()
    } else {
      this.socketTeardown()
    }
  }

  onWakeUp() {
    this.socketSetup()
  }

  componentDidMount() {
    document.addEventListener('visibilitychange', this.onVisibilityChange, false);
    this.socketSetup()
  }

  componentWillUnmount() {
    this.socketTeardown()
    document.removeEventListener('visibilitychange')
  }

  socketSetup() {
    if (!this.socket) {
      this.socket = io(server.address);
      this.socket.on('gardenInfo', this.onReceivedGardenInfo)
      this.socket.on('acquireCreature', this.acquireCreature)
      this.heartbeatInterval = setInterval(() => {
        if (!this.socket) return
        // if (document.hasFocus())
        this.socket.emit('heartbeat')
      }, 3000)
    }
  }

  socketTeardown() {
    this.setState({ creatures: {} })
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
  }

  onReceivedGardenInfo({ localGarden, remoteGardens }) {
    console.log('Local: ', localGarden)
    console.log('Remote: ', remoteGardens)
    this.setState({
      gardenConfig: { localGarden, remoteGardens }
    })
  }

  acquireCreature({ creatureId }) {
    console.log('acquireCreature: ', creatureId)

    const { creatures } = this.state
    this.setState({
      creatures: {
        ...creatures,
        [creatureId]: true
      }
    })
  }

  onCreatureExit(creatureId) {
    const { creatures } = this.state
    console.log('onCreatureExit: ', creatureId)
    this.setState({
      creatures: {
        ...creatures,
        [creatureId]: false
      }
    })

    if (this.socket) {
      const localGardenName = this.state.gardenConfig.localGarden ? this.state.gardenConfig.localGarden.name : undefined
      this.socket.emit('creatureExit', { creatureId, nextGarden: localGardenName })
    }
  }

  render() {
    const { creatures, gardenConfig } = this.state
    const gardenName = gardenConfig.localGarden ? gardenConfig.localGarden.name : ''
    const backgroundClass = classnames({
      "garden-info": true,
      [gardenName]: true
    })

    return (
      <div>
        <Head/>
        { gardenConfig.localGarden && 
          <div className={backgroundClass}>
            <h1 className="garden-heading">garden—{ gardenConfig.localGarden.name}</h1>
          </div>
        }
        {
          Object.keys(creatures).map((creatureId, index) => {
            return <Creature key={creatureId} creatureId={creatureId} isActive={creatures[creatureId]} onExit={this.onCreatureExit}/>
          })
        }
      </div>
    )
  }
}
