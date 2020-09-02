import "./App.css";
import React, { useEffect, useReducer } from "react";
import { API } from "aws-amplify";
import "antd/dist/antd.css";
import { listNotes } from "./graphql/queries";
import { v4 as uuid } from "uuid";
import { List, Input, Button } from "antd";
import { createNote as CreateNote } from "./graphql/mutations";

const CLIENT_ID = uuid();

const initialState = {
  notes: [],
  loading: true,
  error: false,
  form: { name: "", description: "" },
};

function reducer(state, action) {
  switch (action.type) {
    case "ADD_NOTE":
      return { ...state, notes: [action.note, ...state.notes] };
    case "RESET_FORM":
      return { ...state, form: initialState.form };
    case "SET_INPUT":
      return { ...state, form: { ...state.form, [action.name]: action.value } };
    case "SET_NOTES":
      return { ...state, notes: action.notes, loading: false };
    case "ERROR":
      return { ...state, loading: false, error: true };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  async function fetchNotes() {
    try {
      const notesData = await API.graphql({
        query: listNotes,
      });
      dispatch({ type: "SET_NOTES", notes: notesData.data.listNotes.items });
    } catch (err) {
      console.log("error: ", err);
      dispatch({ type: "ERROR" });
    }
  }
  function renderItem(item) {
    return (
      <List.Item style={styles.item}>
        <List.Item.Meta title={item.name} description={item.description} />
      </List.Item>
    );
  }
  async function createNote() {
    const { form } = state;
    if (!form.name || !form.description) {
      return alert("please enter a name and description");
    }
    const note = { ...form, clientId: CLIENT_ID, completed: false, id: uuid() };
    dispatch({ type: "ADD_NOTE", note });
    dispatch({ type: "RESET_FORM" });
    try {
      await API.graphql({
        query: CreateNote,
        variables: { input: note },
      });
      console.log("successfully created note");
    } catch (error) {
      console.log("error: ", error);
    }
  }
  function onChange(e) {
    dispatch({ type: "SET_INPUT", name: e.target.name, value: e.target.value });
  }
  useEffect(() => {
    fetchNotes();
  }, []);
  return (
    <div style={styles.container}>
      <Input
        onChange={onChange}
        value={state.form.name}
        placeholder="Note Name"
        name="name"
        style={styles.input}
      />
      <Input
        onChange={onChange}
        value={state.form.description}
        placeholder="Note Description"
        name="description"
        style={styles.input}
      />
      <Button onClick={createNote} type="primary">
        Create Note
      </Button>
      <List
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
    </div>
  );
}
const styles = {
  container: { padding: 20 },
  input: { marginBottom: 10 },
  item: { textAlign: "left" },
  p: { color: "#1890ff" },
};
