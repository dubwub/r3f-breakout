import React, { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
// import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';
import { MeshLineGeometry, MeshLineMaterial, raycast } from 'meshline'
import { MaterialNode } from '@react-three/fiber'
import { TextureLoader } from 'three/src/loaders/TextureLoader'

import { Canvas, useFrame, ThreeElements, extend, Object3DNode, useLoader } from '@react-three/fiber'
import { Effects, OrbitControls, OrthographicCamera, Line } from '@react-three/drei'
import { UnrealBloomPass } from 'three-stdlib'

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: Object3DNode<MeshLineGeometry, typeof MeshLineGeometry>
    meshLineMaterial: MaterialNode<MeshLineMaterial, typeof MeshLineMaterial>
  }
}
extend({ MeshLineGeometry, MeshLineMaterial })

extend({ UnrealBloomPass })
// extend({ MeshLine, MeshLineMaterial })

// references for glow effect: https://codesandbox.io/s/bloom-hdr-workflow-gnn4yt?file=/src/App.js
// eventually reference this, difficult right now: https://codepen.io/prisoner849/pen/VwamWbm

// orthographic camera for isometric view from here: https://stackoverflow.com/questions/23450588/isometric-camera-with-three-js

// stolen from here: https://docs.pmnd.rs/react-three-fiber/tutorials/typescript#extend-usage
declare module '@react-three/fiber' {
  interface ThreeElements {
    unrealBloomPass: Object3DNode<UnrealBloomPass, typeof UnrealBloomPass>;
  }
}

// stolen from here: https://stackoverflow.com/questions/69955057/how-to-control-movement-of-a-person-in-react-three-fiber
const usePersonControls = () => {
  const keys: any = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
  }

  const moveFieldByKey = (key: string) => keys[key]

  const [movement, setMovement] = useState({
    left: false,
    right: false,
  })

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: true }))
    }
    const handleKeyUp = (e: any) => {
      setMovement((m) => ({ ...m, [moveFieldByKey(e.code)]: false }))
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  return movement
}

function Ball(props: any) {

  const [ vx, setVx ] = React.useState(60);
  const [ vy, setVy ] = React.useState(-120);
  const ballRef = React.useRef<any>();

  const [ color, setColor ] = React.useState("hotpink");

  useFrame((state, delta) => {
    ballRef.current.position.x += delta * vx;
    ballRef.current.position.y += delta * vy;

    if (ballRef.current.position.y < 0) { // bounce, reflect
      setVy(Math.abs(vy));
      ballRef.current.position.y = 0;
      // if (Math.abs(props.state.paddleX - ballRef.current.position.x) < 30) {
      //   setVx(props.state.ballVx)
      // }
    } else if (ballRef.current.position.y > props.state.boundY) {
      setVy(-vy);
      ballRef.current.position.y = props.state.boundY;
    } else if (ballRef.current.position.x < 0) {
      setVx(-vx);
      ballRef.current.position.x = 0;
    } else if (ballRef.current.position.x > props.state.boundX) {
      setVx(-vx);
      ballRef.current.position.x = props.state.boundX;
    }

    // very inefficient
    for (let block of props.blocks) {
      let blockBounds = [block.x, block.y, block.x + 30, block.y - 10];
      // check collision with bottom side
      // if (blockBounds)
    }

    props.setBallState(ballRef.current.position.x, ballRef.current.position.y, vx, vy)
  })

  return (
    <mesh
      position={[50, 0, 100]}
      ref={ballRef}>
      <sphereGeometry args={[5, 32, 16]}>
      </sphereGeometry>
      <meshStandardMaterial emissiveIntensity={2} emissive={color} color={color} />
    </mesh>
  )
}

function Paddle(props: any) {

  const { left, right } = usePersonControls()

  const paddleRef = React.useRef<any>();

  let materials = [];
  let colors = ["yellow", "pink", "hotpink", "black", "blue", "red"]
  for (let i = 0; i < 6; i++) {
    materials.push(<meshStandardMaterial key={"material-" + i} attach={"material-" + i} emissiveIntensity={i} emissive={'hotpink'} color={colors[i]} />)
  }
  // useFrame((state, delta) => (meshRef.current.rotation.x += delta))
  useFrame((state, delta) => {
    let rightMotion = Number(right) - Number(left);
    let new_x = paddleRef.current.position.x + rightMotion * 10;
    if (new_x < 0) { new_x = 0; }
    if (new_x > props.state.boundX) { new_x = props.state.boundX; }

    paddleRef.current.position.x = new_x;
    props.setPaddleState(paddleRef.current.position.x, rightMotion * 10)
  })
  return (
    <mesh
      position={[50, 0, 0]}
      ref={paddleRef}>
      <boxGeometry args={[30, 10, 10]} />
      { materials }
    </mesh>
  )
}

function Block(props: any) {
  const colors = [
    0xed6a5a,
    0xf4f1bb,
    0x9bc1bc,
    0x5ca4a9,
    0xe6ebe0,
    0xf0b67f,
    0xfe5f55,
    0xd6d1b1,
    0xc7efcf,
    0xeef5db,
    0x50514f,
    0xf25f5c,
    0xffe066,
    0x247ba0,
    0x70c1b3
  ];

  let color = new THREE.Color(colors[props.index % colors.length]);

  return (
    <mesh
      position={[props.blockX, props.blockY, 0]}>
      <boxGeometry args={[30, 10, 10]} />
      <meshStandardMaterial emissiveIntensity={0.5} emissive={color} color={color} />
    </mesh>
  )
}

function App() {

  const [ state, setState ] = React.useState<any>({
    paddleX: 50,
    paddleVX: 0,
    ballX: 50,
    ballY: 50,
    ballVX: 0,
    ballVY: -10,
    boundX: 300,
    boundY: 400
  });

  let blockWidth = 30;
  let blockHeight = 10;
  let initBlocks = [];
  for (let x = blockWidth/2; x < state.boundX; x += blockWidth ) {
    for (let y = 0; y < 10; y += 1) {
      initBlocks.push({x: x, y: state.boundY - blockHeight * y})
    }
  }
  const [ blocks, setBlocks ] = React.useState<any>(initBlocks);

  const setPaddleState = (x: number, vx: number) => {
    setState({...state, paddleX: x, paddleVX: vx})
  }

  const setBallState = (x: number, y: number, vx: number, vy: number) => {
    setState({...state, ballX: x, ballY: y, ballVX: vx, ballVY: vy})
  }

  // this is super inefficient ...
  const blowUpBlock = (index: number) => {
    setBlocks(blocks.filter((_: any, _index: number) => {
      if (index === _index) return false;
      else return true;
    }))
  }

  return (
    <Canvas style={{width: "100%", height: "100%"}}>
      <Effects disableGamma>
        <unrealBloomPass threshold={1} strength={0.4} radius={0.05}/>
      </Effects>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />

      <mesh position={[state.boundX / 2, state.boundY / 2, 50]}>
        <boxGeometry args={[state.boundX, state.boundY, 100]} />
        <meshStandardMaterial wireframe wireframeLinewidth={1}/>
      </mesh>

      <OrbitControls />
      <Paddle state={state} setPaddleState={setPaddleState} />
      <Ball state={state} blocks={blocks} blowUpBlock={blowUpBlock} setBallState={setBallState}/>
      
      { blocks.map((block: any, index: number) => <Block blockX={block.x} blockY={block.y} index={index}/>)}

      <OrthographicCamera
        makeDefault
        zoom={1}
        top={200}
        bottom={-50}
        left={-50}
        right={150}
        near={-200}
        far={200}
        position={[-50, 0, 0]}
      />
    </Canvas>
  );
}

export default App;
