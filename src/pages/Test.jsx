import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

import { Page } from 'components'

const stuff = [
  { id: 1, name: 'Hildo' },
  { id: 2, name: 'Roland' },
  { id: 3, name: 'Jonas' },
]

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

export function Test() {
  const [list, setList] = useState(stuff)
  const handleDragEnd = ({ destination, source }) => {
    console.log(destination, source)
    if (!destination)
      return
    setList(reorder(list, source.index, destination.index))
  }
  return (
    <Page title="Test page" backButton="/create">
      <p>This is a test page. It will often have random contents used for testing purposes.</p>
      <List
        list={list}
        onDragEnd={handleDragEnd}
        dragItemStyle={{
          background: 'pink',
          borderRadius: '16px',
        }}
        dragListStyle={{
          background: 'lightblue',
          borderRadius: '16px',
        }}>
        {(item, dragHandleProps) => <>
          <span {...dragHandleProps}>#</span>
          <span>{item.name}</span>
        </>}
      </List>
    </Page>
  )
}


function List({ list, onDragEnd, dragListStyle = {}, ...props }) {
  return <DragDropContext onDragEnd={onDragEnd}>
    <Droppable droppableId="droppable">{(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.droppableProps}
        style={{
          ...(snapshot.isDraggingOver ? dragListStyle : {}),
        }}>
        {list.map((item, index) => <Item key={item.id} index={index} item={item} {...props} />)}
        {provided.placeholder}
      </div>
    )}</Droppable>
  </DragDropContext>
}

function Item({ index, item, dragItemStyle, children }) {
  return <Draggable key={`ID${item.id}`} index={index} draggableId={item.id.toString() + 'id'}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        style={{
          // default item style
          padding: '8px 16px',
          // default drag style
          ...provided.draggableProps.style,
          // customized drag style
          ...(snapshot.isDragging ? dragItemStyle : {}),
        }}
      >
        {children(item, provided.dragHandleProps)}
      </div>
    )}
  </Draggable>
}
