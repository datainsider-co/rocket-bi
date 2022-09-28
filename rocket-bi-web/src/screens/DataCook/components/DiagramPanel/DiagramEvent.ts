export enum DiagramEvent {
  AddItem = 'add_item',
  MoveItem = 'move_id',
  ChangeConnectorColor = 'change_connector_color'
}

export enum DiagramZIndex {
  Connector = 2,
  Item = 0,
  HoveredItem = 2
}
