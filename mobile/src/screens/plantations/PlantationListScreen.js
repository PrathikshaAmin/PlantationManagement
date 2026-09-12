import { useCallback, useState } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../api/client";

export default function PlantationListScreen({ navigation }) {
  const [plantations, setPlantations] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlantations = async (searchTerm = search) => {
    const res = await api.get("/plantations", { params: { search: searchTerm, limit: 50 } });
    setPlantations(res.data.data);
  };

  useFocusEffect(useCallback(() => { fetchPlantations(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlantations();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search plantations..."
        value={search}
        onChangeText={(v) => { setSearch(v); fetchPlantations(v); }}
      />
      <FlatList
        data={plantations}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No plantations found</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("PlantationDetails", { id: item._id })}>
            <Text style={styles.cardTitle}>{item.plantationName}</Text>
            <Text style={styles.cardSub}>{item.plantationCode} · {item.plantationType || "-"}</Text>
            <Text style={styles.cardSub}>{item.area} {item.areaUnit} · {item.farmer?.farmerName || "-"}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("PlantationForm", {})}>
        <Text style={styles.fabText}>+ Add Plantation</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7f3", padding: 12 },
  search: { backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#ddd" },
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 14, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1f2a1f" },
  cardSub: { fontSize: 13, color: "#667", marginTop: 2 },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
  fab: { backgroundColor: "#2f6d3c", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 8 },
  fabText: { color: "#fff", fontWeight: "700" },
});
