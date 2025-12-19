---
title: "Chapter 5: Bridging AI to Robot Control"
description: "Implementing AI integration in ROS 2 for intelligent robot control"
sidebar_position: 3
---

# Chapter 5: Bridging AI to Robot Control

## Learning Objectives

After completing this chapter, you should be able to:

- Understand how to integrate AI models with ROS 2 for robot control
- Implement AI-based decision making in robot control systems
- Design communication patterns between AI systems and robot hardware
- Apply real-time AI processing for dynamic robot behavior

## Introduction to AI-Robot Integration

The integration of artificial intelligence with robotic systems is fundamental to Physical AI. While traditional robotics relies on predetermined behaviors and control algorithms, modern robots increasingly use AI to perceive, reason, and act in dynamic, unstructured environments.

### Why Bridge AI and Robot Control?

The bridge between AI and robot control enables:

- **Perception-Action Integration**: Converting sensor data through AI models into executable robot commands
- **Adaptive Behaviors**: Using AI to adjust robot responses based on environmental changes
- **Learning-Based Control**: Implementing reinforcement learning and other ML techniques in robot control
- **Natural Interaction**: Enabling robots to understand and respond to human commands through NLP

### Technical Architecture

AI-robot integration in ROS 2 typically follows this architecture:

1. **Sensor Interface Layer**: Collects raw sensor data from cameras, LiDAR, IMUs, etc.
2. **AI Processing Layer**: Applies AI models to sensor data for perception, reasoning, or planning
3. **Action Translation Layer**: Converts AI outputs into robot commands
4. **Control Execution Layer**: Executes commands on robot hardware

### Technical Diagrams

![AI-ROS Integration Diagram](/img/ros2-architecture.svg)

> **Figure 1**: AI-ROS Integration Architecture. This diagram illustrates how AI models interact with the ROS 2 system. Raw sensor data from various robot sensors flows into AI processing nodes that apply perception, reasoning, and planning algorithms. The AI outputs are then translated into ROS 2 messages that control the robot's actuators and behaviors.

## Real-time AI Processing in ROS 2

### Performance Considerations

Real-time AI processing in robotics requires careful attention to:

- **Processing Latency**: AI models must complete inference within robot control loop timing constraints
- **Computational Efficiency**: Optimizing models for the available hardware (CPU, GPU, edge accelerators)
- **Memory Management**: Managing memory usage to avoid real-time performance issues
- **Resource Contention**: Handling competition between multiple AI processes and ROS nodes

### Implementation Strategies

```python
# Example: Real-time AI processing node in ROS 2
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from geometry_msgs.msg import Twist
from std_msgs.msg import String
import numpy as np
import torch
from torchvision import transforms

class AIControlNode(Node):
    def __init__(self):
        super().__init__('ai_control_node')
        
        # AI model initialization
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = self.load_model()  # Load your trained model
        self.model.to(self.device)
        self.model.eval()
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Resize((224, 224)),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
        
        # Create subscribers and publishers
        self.image_sub = self.create_subscription(
            Image,
            '/camera/image_raw',
            self.image_callback,
            10)
            
        self.cmd_vel_pub = self.create_publisher(
            Twist,
            '/cmd_vel',
            10)
            
        self.status_pub = self.create_publisher(
            String,
            '/ai_control_status',
            10)
            
        # Control loop timer
        self.timer = self.create_timer(0.1, self.control_loop)  # 10Hz control loop
        
        # State variables
        self.latest_image = None
        self.ai_command = None
        self.last_inference_time = self.get_clock().now()

    def load_model(self):
        """Load your pre-trained AI model"""
        # Example: Load a pre-trained model
        # model = MyAIModel.load_from_checkpoint('path/to/model.pth')
        # return model
        pass

    def image_callback(self, msg):
        """Process incoming image messages for AI inference"""
        # Convert ROS Image message to numpy array
        if msg.encoding == 'rgb8':
            image = np.frombuffer(msg.data, dtype=np.uint8)
            image = image.reshape((msg.height, msg.width, 3))
            self.latest_image = image

    def control_loop(self):
        """Main control loop performing AI inference and command execution"""
        if self.latest_image is not None:
            try:
                # Perform AI inference
                start_time = self.get_clock().now()
                
                # Preprocess image
                input_tensor = self.transform(self.latest_image).unsqueeze(0).to(self.device)
                
                # Run inference
                with torch.no_grad():
                    output = self.model(input_tensor)
                
                # Process model output to generate robot command
                self.ai_command = self.process_model_output(output)
                
                # Publish command to robot
                self.publish_command(self.ai_command)
                
                # Calculate and log inference time
                inference_time = (self.get_clock().now() - start_time).nanoseconds / 1e9
                
                # Publish status message
                status_msg = String()
                status_msg.data = f"AI control active. Inference time: {inference_time:.3f}s"
                self.status_pub.publish(status_msg)
                
                self.last_inference_time = self.get_clock().now()
                
            except Exception as e:
                self.get_logger().error(f"Error during AI inference: {str(e)}")

    def process_model_output(self, output):
        """Convert AI model output to robot control command"""
        # Example: Convert model output to Twist command
        # This implementation depends on your specific AI model
        cmd_vel = Twist()
        
        # Parse model output (example for navigation task)
        # output[0] might be linear velocity, output[1] might be angular velocity
        cmd_vel.linear.x = float(output[0][0].item())  # Linear velocity
        cmd_vel.angular.z = float(output[0][1].item())  # Angular velocity
        
        return cmd_vel

    def publish_command(self, cmd_vel):
        """Publish robot command to appropriate topic"""
        if cmd_vel:
            self.cmd_vel_pub.publish(cmd_vel)

def main(args=None):
    rclpy.init(args=args)
    ai_control_node = AIControlNode()
    
    try:
        rclpy.spin(ai_control_node)
    except KeyboardInterrupt:
        pass
    finally:
        ai_control_node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
```

## AI Model Integration Patterns

### Pattern 1: Perception Integration

Integrating AI models that process sensory data to extract meaningful information:

```python
# Example: Object detection for robot navigation
import cv2
import numpy as np
from sensor_msgs.msg import Image
from vision_msgs.msg import Detection2DArray, Detection2D, ObjectHypothesisWithPose

class ObjectDetectionNode(Node):
    def __init__(self):
        super().__init__('object_detection_node')
        
        # Initialize object detection model (e.g., YOLO)
        self.model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
        
        self.image_sub = self.create_subscription(
            Image,
            '/camera/image_raw',
            self.image_callback,
            10)
            
        self.detection_pub = self.create_publisher(
            Detection2DArray,
            '/object_detections',
            10)

    def image_callback(self, msg):
        # Convert ROS image to OpenCV format
        image = self.ros_image_to_cv2(msg)
        
        # Perform object detection
        results = self.model(image)
        
        # Convert results to ROS message format
        detections = self.process_detections(results)
        
        # Publish detections
        self.detection_pub.publish(detections)

    def process_detections(self, results):
        # Convert YOLO results to Detection2DArray message
        detections_array = Detection2DArray()
        
        # Process results and populate the message
        for detection in results.xyxy[0]:  # [x1, y1, x2, y2, confidence, class]
            detection_msg = Detection2D()
            detection_msg.bbox.center.x = (detection[0] + detection[2]) / 2
            detection_msg.bbox.center.y = (detection[1] + detection[3]) / 2
            detection_msg.bbox.size_x = detection[2] - detection[0]
            detection_msg.bbox.size_y = detection[3] - detection[1]
            
            # Add confidence and class information
            hypothesis = ObjectHypothesisWithPose()
            hypothesis.hypothesis.class_id = str(int(detection[5]))
            hypothesis.hypothesis.score = float(detection[4])
            detection_msg.results.append(hypothesis)
            
            detections_array.detections.append(detection_msg)
            
        return detections_array
```

### Pattern 2: Control Integration

Using AI to directly control robot motion based on environmental state:

```python
# Example: Learning-based control policy
class LearningBasedController(Node):
    def __init__(self):
        super().__init__('learning_controller')
        
        # Load trained control policy
        self.policy_network = self.load_policy()
        
        # Subscribe to state information (e.g., position, velocity, obstacles)
        self.state_sub = self.create_subscription(
            RobotState,
            '/robot_state',
            self.state_callback,
            10)
            
        self.cmd_pub = self.create_publisher(
            Twist,
            '/cmd_vel',
            10)
            
        # Control loop
        self.timer = self.create_timer(0.05, self.control_callback)  # 20Hz
        self.current_state = None
        self.next_action = None

    def state_callback(self, msg):
        """Update current robot state from sensor data"""
        self.current_state = self.extract_state_features(msg)
        
    def control_callback(self):
        """Execute AI-based control policy"""
        if self.current_state is not None:
            with torch.no_grad():
                # Convert state to tensor
                state_tensor = torch.tensor(self.current_state, dtype=torch.float32).unsqueeze(0)
                
                # Get action from policy
                action_tensor = self.policy_network(state_tensor)
                
                # Convert to ROS command
                cmd_vel = self.tensor_to_twist(action_tensor)
                
                # Publish command
                self.cmd_pub.publish(cmd_vel)
                
    def extract_state_features(self, robot_state_msg):
        """Extract numerical features from robot state message"""
        # Extract relevant features for control policy
        features = [
            robot_state_msg.linear_velocity.x,
            robot_state_msg.angular_velocity.z,
            robot_state_msg.distance_to_obstacle_front,
            robot_state_msg.distance_to_obstacle_left,
            robot_state_msg.distance_to_obstacle_right,
            # Add more features as needed
        ]
        return features
```

### Pattern 3: Planning Integration

Using AI for high-level planning and decision making:

```python
# Example: AI-based task planning
class AIPlannerNode(Node):
    def __init__(self):
        super().__init__('ai_planner_node')
        
        # Initialize high-level planner
        self.planner = self.load_planner()
        
        # Subscribe to goals and environmental state
        self.goal_sub = self.create_subscription(
            Goal,
            '/robot_goal',
            self.goal_callback,
            10)
            
        self.env_state_sub = self.create_subscription(
            EnvironmentState,
            '/environment_state',
            self.env_state_callback,
            10)
            
        self.plan_pub = self.create_publisher(
            RobotPlan,
            '/robot_plan',
            10)
            
        self.current_goal = None
        self.current_env_state = None

    def goal_callback(self, msg):
        """Receive new goal for planning"""
        self.current_goal = msg
        if self.current_env_state:
            self.generate_plan()

    def env_state_callback(self, msg):
        """Update environmental state"""
        self.current_env_state = msg
        if self.current_goal:
            self.generate_plan()

    def generate_plan(self):
        """Generate plan using AI planner"""
        if self.current_goal and self.current_env_state:
            plan = self.planner.plan(self.current_env_state, self.current_goal)
            
            # Publish plan
            plan_msg = self.plan_to_ros_message(plan)
            self.plan_pub.publish(plan_msg)
```

## Design Patterns for AI-ROS Integration

### Publisher-Subscriber with AI Processing

This pattern involves AI nodes that subscribe to sensor data, process it, and publish results:

```python
class AIPreprocessingNode(Node):
    def __init__(self):
        super().__init__('ai_preprocessing_node')
        
        # Subscribe to raw sensor data
        self.raw_sub = self.create_subscription(
            LaserScan,
            '/scan',
            self.scan_callback,
            10)
            
        # Publish processed data
        self.processed_pub = self.create_publisher(
            ProcessedLaserScan,
            '/processed_scan',
            10)
            
        # Load AI model for preprocessing
        self.preprocessing_model = self.load_preprocessing_model()

    def scan_callback(self, msg):
        """Process incoming laser scan with AI model"""
        # Convert ROS message to format expected by AI model
        scan_np = np.array(msg.ranges)
        
        # Apply AI-based preprocessing
        processed_scan = self.preprocessing_model.process(scan_np)
        
        # Convert back to ROS message
        processed_msg = self.create_processed_message(processed_scan, msg.header)
        
        # Publish processed data
        self.processed_pub.publish(processed_msg)
```

### Action-Based Integration

For complex, long-running tasks, ROS 2 actions work well with AI planning:

```python
from rclpy.action import ActionServer, CancelResponse, GoalResponse
from robot_actions.action import NavigateToPosition

class AINavigationActionServer(Node):
    def __init__(self):
        super().__init__('ai_navigation_action_server')
        
        # Create action server
        self._action_server = ActionServer(
            self,
            NavigateToPosition,
            'navigate_to_position',
            self.execute_callback,
            goal_callback=self.goal_callback,
            cancel_callback=self.cancel_callback)
            
        # AI navigation system
        self.ai_navigator = self.initialize_ai_navigator()
        
        # Robot command publisher
        self.cmd_vel_pub = self.create_publisher(Twist, '/cmd_vel', 10)

    def goal_callback(self, goal_request):
        """Accept or reject navigation goals"""
        # Check if goal is valid using AI
        is_valid = self.ai_navigator.validate_goal(goal_request.target_pose)
        if is_valid:
            return GoalResponse.ACCEPT
        else:
            return GoalResponse.REJECT

    def execute_callback(self, goal_handle):
        """Execute navigation goal using AI"""
        feedback_msg = NavigateToPosition.Feedback()
        result = NavigateToPosition.Result()
        
        target_pose = goal_handle.request.target_pose
        
        # Start AI navigation
        self.ai_navigator.start_navigating(target_pose)
        
        while self.ai_navigator.is_navigating():
            # Get feedback from AI navigator
            current_pose = self.ai_navigator.get_current_pose()
            distance_remaining = self.ai_navigator.get_distance_to_goal()
            
            # Publish feedback
            feedback_msg.current_pose = current_pose
            feedback_msg.distance_remaining = distance_remaining
            goal_handle.publish_feedback(feedback_msg)
            
            # Publish velocity commands from AI navigator
            cmd_vel = self.ai_navigator.get_command_velocity()
            self.cmd_vel_pub.publish(cmd_vel)
            
            # Check if preempted
            if goal_handle.is_cancel_requested:
                result.success = False
                goal_handle.canceled()
                self.ai_navigator.cancel_navigation()
                return result
                
        # Navigation complete
        if self.ai_navigator.is_successful():
            result.success = True
            goal_handle.succeed()
        else:
            result.success = False
            goal_handle.abort()
            
        return result
```

## Quality of Service Considerations for AI Nodes

### Managing Latency and Reliability

AI processing nodes often have specific QoS requirements due to their real-time nature:

```python
from rclpy.qos import QoSProfile, ReliabilityPolicy, DurabilityPolicy, HistoryPolicy

def create_qos_for_ai_processing():
    """Create appropriate QoS profile for AI processing nodes"""
    # For real-time perception - prioritize latest data
    perception_qos = QoSProfile(
        history=HistoryPolicy.KEEP_LAST,
        depth=1,  # Only keep latest message to reduce latency
        reliability=ReliabilityPolicy.BEST_EFFORT,  # Accept message loss for lower latency
        durability=DurabilityPolicy.VOLATILE
    )
    
    # For safety-critical AI decisions - prioritize reliability
    safety_qos = QoSProfile(
        history=HistoryPolicy.KEEP_LAST,
        depth=10,  # Keep more messages for reliability
        reliability=ReliabilityPolicy.RELIABLE,  # Ensure delivery
        durability=DurabilityPolicy.VOLATILE
    )
    
    return perception_qos, safety_qos
```

## Best Practices for AI-ROS Integration

### 1. Model Optimization

AI models should be optimized for deployment on robotic platforms:

```python
def optimize_model_for_robot(self, model):
    """Optimize AI model for deployment on robot hardware"""
    # Convert to TorchScript for faster inference
    traced_model = torch.jit.trace(model, example_input)
    
    # Or use TensorRT for NVIDIA hardware
    if torch.cuda.is_available():
        import tensorrt as trt
        optimized_model = self.convert_to_tensorrt(traced_model)
        return optimized_model
    
    return traced_model
```

### 2. Resource Management

Monitor and manage computational resources to ensure real-time performance:

```python
import psutil
import GPUtil

class ResourceMonitor:
    def __init__(self, node):
        self.node = node
        self.cpu_threshold = 90  # percent
        self.gpu_threshold = 90  # percent
        self.memory_threshold = 90  # percent
        
    def check_resources(self):
        """Check if system resources are adequate for AI processing"""
        cpu_percent = psutil.cpu_percent()
        memory_percent = psutil.virtual_memory().percent
        
        if torch.cuda.is_available():
            gpu_percent = GPUtil.getGPUs()[0].load * 100
            gpu_memory_percent = GPUtil.getGPUs()[0].memoryUtil * 100
            
            if gpu_percent > self.gpu_threshold or gpu_memory_percent > self.gpu_threshold:
                self.node.get_logger().warn(
                    f"GPU usage high: {gpu_percent:.1f}% utilization, "
                    f"{gpu_memory_percent:.1f}% memory")
        
        if cpu_percent > self.cpu_threshold or memory_percent > self.memory_threshold:
            self.node.get_logger().warn(
                f"System resources high: CPU {cpu_percent:.1f}%, "
                f"Memory {memory_percent:.1f}%")
```

### 3. Safety and Fallback Mechanisms

Implement safety mechanisms to handle AI failures:

```python
class SafeAIController(Node):
    def __init__(self):
        super().__init__('safe_ai_controller')
        
        # Primary AI controller
        self.ai_controller = AIController()
        
        # Fallback controller
        self.fallback_controller = FallbackController()
        
        # Health monitoring
        self.ai_healthy = True
        self.last_ai_update = self.get_clock().now()
        self.health_check_timer = self.create_timer(1.0, self.health_check)
        
        # Command publisher
        self.cmd_vel_pub = self.create_publisher(Twist, '/cmd_vel', 10)

    def health_check(self):
        """Check if AI controller is responding appropriately"""
        time_since_last_update = (self.get_clock().now() - self.last_ai_update).nanoseconds / 1e9
        
        if time_since_last_update > 2.0:  # 2 seconds without update
            if self.ai_healthy:
                self.get_logger().warn("AI controller unresponsive, switching to fallback")
                self.ai_healthy = False

    def control_loop(self):
        """Main control loop with safety fallback"""
        if self.ai_healthy:
            try:
                cmd_vel = self.ai_controller.compute_command()
                if cmd_vel is not None:
                    self.cmd_vel_pub.publish(cmd_vel)
                    self.last_ai_update = self.get_clock().now()
                else:
                    # AI returned None, use fallback
                    cmd_vel = self.fallback_controller.compute_fallback_command()
                    self.cmd_vel_pub.publish(cmd_vel)
            except Exception as e:
                self.get_logger().error(f"AI controller error: {e}, switching to fallback")
                self.ai_healthy = False
        else:
            # Use fallback controller
            cmd_vel = self.fallback_controller.compute_fallback_command()
            self.cmd_vel_pub.publish(cmd_vel)
```

## Exercises

1. **Implementation Exercise**: Create a ROS 2 node that integrates a pre-trained image classification model with a robot control system. The robot should respond differently based on objects detected in its camera feed (e.g., stop when detecting red objects, move toward blue objects).

2. **Design Exercise**: Design a system architecture for AI-based navigation that works with ROS 2 Navigation stack (Nav2). Identify the interfaces between the AI planning system and the ROS 2 navigation system, and specify the message types that would be exchanged.

3. **Performance Analysis**: Analyze the computational requirements for running an object detection model (like YOLO) in real-time on a typical embedded robotics platform (e.g., NVIDIA Jetson). Suggest optimizations to meet real-time requirements.

## Summary

This chapter covered the essential concepts and techniques for bridging AI systems with robot control in ROS 2. We explored various integration patterns, from simple perception-to-action loops to complex planning and control systems. Key takeaways include:

- The architecture patterns for integrating AI models with ROS 2 systems
- Performance considerations when running AI models in real-time environments
- Different integration patterns for perception, control, and planning
- Quality of Service settings appropriate for AI-ROS integration
- Best practices for model optimization, resource management, and safety

The bridge between AI and robot control is critical for creating truly intelligent robotic systems that can perceive, reason, and act autonomously in complex environments.

## Cross-references

For foundational concepts about Physical AI, see [Chapter 1: Introduction to Physical AI](../part-01-foundations/chapter-1). For ROS 2 architecture concepts, see [Chapter 3: ROS 2 Architecture Fundamentals](../part-02-ros2/chapter-3). For package development, see [Chapter 4: Building ROS 2 Packages](../part-02-ros2/chapter-4). For robot description, see [Chapter 6: Robot Description with URDF](../part-02-ros2/chapter-6).