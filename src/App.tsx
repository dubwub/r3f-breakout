import React, { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
// import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';
import { MeshLineGeometry, MeshLineMaterial, raycast } from 'meshline'
import { MaterialNode } from '@react-three/fiber'
import { TextureLoader } from 'three/src/loaders/TextureLoader'

import { Canvas, useFrame, ThreeElements, extend, Object3DNode, useLoader } from '@react-three/fiber'
import { Effects, OrbitControls, OrthographicCamera, Line, Trail } from '@react-three/drei'
import { UnrealBloomPass } from 'three-stdlib'

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

function CameraDriver(props: any) {
  const [ rotation, setRotation ] = React.useState<any>({ x: 0, y: 0, z: 0 })
  useFrame((state, delta) => {
    setRotation({
      x: rotation.x + 0.1 * delta * Math.random(),
      y: rotation.y + 0.1 * delta * Math.random(),
      z: rotation.z + 0.1 * delta * Math.random()
    })
    state.camera.rotation.set(rotation.x, rotation.y, rotation.z);
    state.camera.updateProjectionMatrix();
  })
  return (
    <></>
  )
}

function Ball(props: any) {
  const radius = 5;

  const [ vx, setVx ] = React.useState(60);
  const [ vy, setVy ] = React.useState(-120);
  const ballRef = React.useRef<any>();

  const [ color, setColor ] = React.useState("hotpink");

  const [ shakeIntensity, setShakeIntensity ] = React.useState(0);

  useFrame((state, delta) => {
    
    if (shakeIntensity > 0) {
      state.camera.position.set(0, 0, (Math.random() - 0.5) * shakeIntensity)
      state.camera.updateProjectionMatrix();

      let nextShake = shakeIntensity * 0.9;
      if (nextShake < 10) {
        nextShake = 0;
        state.camera.position.set(0, 0, 0);
      }
      setShakeIntensity(nextShake);
    }

    
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
    props.blocks.forEach((block: any, index: number) => {
      if (props.blownUpBlocks.has(index)) { return; }

      let ballX = ballRef.current.position.x;
      let ballY = ballRef.current.position.y;
      
      // check collision with bottom side
      if (ballX >= block.x && ballX <= block.x + 30 &&
          ballY < block.y - 10 && ballY + radius >= block.y - 10) {
        setVy(-vy);
        props.blowUpBlock(index);
        setShakeIntensity(100);
      }
      // check collision with top side
      else if (ballX >= block.x && ballX <= block.x + 30 &&
        ballY > block.y - 10 && ballY - radius <= block.y - 10) {
        setVy(-vy);
        props.blowUpBlock(index);
        setShakeIntensity(100);
      }
      // check collision with left side
      else if (ballY <= block.y && ballY >= block.y - 10 &&
        ballX < block.x && ballX + radius >= block.x) {
        setVx(-vx);
        props.blowUpBlock(index);
        setShakeIntensity(100);
      }
      // check collision with right side
      else if (ballY <= block.y && ballY >= block.y - 10 &&
        ballX > block.x + 30 && ballX - radius <= block.x + 30) {
        setVx(-vx);
        props.blowUpBlock(index);
        setShakeIntensity(100);
      }
    })

    props.setBallState(ballRef.current.position.x, ballRef.current.position.y, vx, vy)
  })

  return (
    <mesh
      position={[50, 0, 0]}
      ref={ballRef}>
      <sphereGeometry args={[radius, 32, 16]}>
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
  let color = new THREE.Color(colors[props.index % colors.length]); // colors are global, sorry code-style

  return (
    <mesh
      position={[props.blockX, props.blockY, 0]}>
      <boxGeometry args={[30, 10, 10]} />
      <meshStandardMaterial emissiveIntensity={0.5} emissive={color} color={color} />
    </mesh>
  )
}

function Particle(props: any) {
  let color = new THREE.Color(props.color);
  const [vy, setVy] = React.useState(props.vy);
  const particleRef = React.useRef<any>();

  useFrame((state, delta) => {
    particleRef.current.position.x += delta * props.vx;
    particleRef.current.position.y += delta * vy;
    particleRef.current.position.z += delta * props.vx;
    particleRef.current.rotation.x += delta * props.vx;

    setVy(vy - delta * 5); // gravity
  })

  return (
    <mesh position={[props.x, props.y, 0]} ref={particleRef}>
      <boxGeometry args={[props.radius, props.radius, props.radius]} />
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
  const [ blownUpBlocks, setBlownUpBlocks ] = React.useState(new Set<number>());

  const [ particles, setParticles ] = React.useState<any>([]);

  const setPaddleState = (x: number, vx: number) => {
    setState({...state, paddleX: x, paddleVX: vx})
  }

  const setBallState = (x: number, y: number, vx: number, vy: number) => {
    setState({...state, ballX: x, ballY: y, ballVX: vx, ballVY: vy})
  }

  // this is super inefficient ...
  const blowUpBlock = (index: number) => {
    let newSet = new Set(blownUpBlocks);
    newSet.add(index);
    setBlownUpBlocks(newSet);

    let newParticles = [...particles];
    for (let i = 0; i < 10; i++) {
      let color = colors[index % colors.length];
      newParticles.push(<Particle 
        color={color}
        x={blocks[index].x}
        y={blocks[index].y}
        vx={(Math.random() - 0.5) * 100}
        vy={Math.random() * 60}
        radius={Math.random() * 10}
      />)
    }

    setParticles(newParticles)
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

      { particles }

      <CameraDriver />

      {/* <OrbitControls /> */}
      <Paddle state={state} setPaddleState={setPaddleState} />
      <Trail
        width={0.1} // Width of the line
        color={'hotpink'} // Color of the line
        length={10} // Length of the line
        decay={1} // How fast the line fades away
        local={false} // Wether to use the target's world or local positions
        stride={0} // Min distance between previous and current point
        interval={1} // Number of frames to wait before next calculation
        target={undefined} // Optional target. This object will produce the trail.
        attenuation={(width) => width} // A function to define the width in each point along it.
      >
        <Ball state={state} blocks={blocks} blownUpBlocks={blownUpBlocks} blowUpBlock={blowUpBlock} setBallState={setBallState}/>
      </Trail>

      { blocks.map((block: any, index: number) => {
        // ew this is ugly, but good for now (adding a .filter() fucks with the indices)
        if (blownUpBlocks.has(index)) { return <></> }
        else {
          return <Block blockX={block.x} blockY={block.y} index={index}/>
        }
      })}

      <OrthographicCamera
        makeDefault
        zoom={1}
        top={300}
        bottom={-300}
        left={-300}
        right={300}
        near={-400}
        far={400}
        position={[0, 0, 0]}
      />
    </Canvas>
  );
}

export default App;
