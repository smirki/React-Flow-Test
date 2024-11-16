import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';

function generateSuggestedNodes(node, questions, followUps = [], radius = 100) {
  const angleStep = (2 * Math.PI) / 3;
  let baseId = parseInt(node.id, 10) + 1;
  let suggestedNodes = [];
  let sourceData = followUps.length ? followUps.map(followUp => ({ question: followUp, term: "" })) : questions;

  
  for (let i = 0; i < 3; i++) {
    let angle = angleStep * i;
    let id = baseId + String.fromCharCode(97 + i);
    let position = {
      x: node.position.x + radius * Math.cos(angle),
      y: node.position.y + radius * Math.sin(angle),
    };
    let data = sourceData[i] ? sourceData[i] : { question: `Question ${id} for ${node.data.label}`, term: "" };

    suggestedNodes.push({
      id,
      position,
      data: { label: data.question },
      parentNode: node.id,
      term: data.term,
      followUps: data.followUps || []
    });
  }

  return suggestedNodes;
}


export default function App() {
  const [graphKey, setGraphKey] = useState('bob');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [suggestedNodes, setSuggestedNodes] = useState([]);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetch('/questions.json')
      .then(response => response.json())
      .then(data => {
        setQuestions(data[graphKey].questions);
        setNodes([{ id: '1', position: { x: 500, y: 300 }, data: { label: graphKey } }]);
      });
  }, [graphKey]);

  const onNodeClick = useCallback(
    (event, node) => {
      if (node.style) {
        let newEdgeId = `e${node.parentNode}-${node.id}`;
        if (!edges.find((edge) => edge.id === newEdgeId)) {
          setEdges((prevEdges) => [
            ...prevEdges,
            { id: newEdgeId, source: node.parentNode, target: node.id },
          ]);
          setNodes((prevNodes) =>
            [...prevNodes, { ...node, data: {label: node.term} }]
          );
          setSuggestedNodes(generateSuggestedNodes(node, questions, node.followUps));
        }
      } else {
        if (suggestedNodes.find((n) => n.parentNode === node.id)) {
          setSuggestedNodes([]);
        } else {
          setNodes((prevNodes) => [
            ...prevNodes,
            node,
          ]);
          setSuggestedNodes(generateSuggestedNodes(node, questions));
        }
      }
    },
    [edges, nodes, suggestedNodes, questions]
  );
  
  

  const onSidebarItemClick = useCallback(
    (key) => {
      setGraphKey(key);
      setNodes([]);
      setEdges([]);
      setSuggestedNodes([]);
    },
    []
  );

  const sidebarItems = ["bob", "peter"].map((key) => (
    <div key={key} onClick={() => onSidebarItemClick(key)}>
      {key}
    </div>
  ));

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <div
        style={{
          overflowY: 'auto',
          width: '20%',
          backgroundColor: '#f0f0f0',
          padding: '10px',
        }}
      >
        {sidebarItems}
      </div>
      <div style={{ width: '80%' }}>
        <ReactFlow
          nodes={nodes.concat(
            suggestedNodes.map((node) => ({
              ...node,
              style: { backgroundColor: '#ccc' },
            }))
          )}
          edges={edges}
          onNodeClick={onNodeClick}
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
