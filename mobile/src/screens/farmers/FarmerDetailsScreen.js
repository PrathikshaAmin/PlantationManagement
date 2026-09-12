import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../api/client";

export default function FarmerDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const [farmer, setFarmer] = useState(null);
  const [plantations, setPlantations] = useState([]);

  useFocusEffect(
    useCallback(() => {
      api.get(`/farmers/${id}`).then((res) => setFarmer(res.data.data));
      api.get("/plantations", { params: { farmer: id, limit: 50 } }).then((res) => setPlantations(res.data.data));
    }, [id]),
  );

  if (!farmer) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.name}>{farmer.farmerName}</Text>
      <Text style={styles.sub}>{farmer.mobileNumber}</Text>

      <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("FarmerForm", { id })}>
        <Text style={styles.editBtnText}>Edit Farmer</Text>
      </TouchableOpacity>

      <Section title="Address">
        <Row label="Village" value={farmer.address?.village} />
        <Row label="Taluk" value={farmer.address?.taluk} />
        <Row label="District" value={farmer.address?.district} />
        <Row label="State" value={farmer.address?.state} />
        <Row label="PIN Code" value={farmer.address?.pinCode} />
      </Section>

      <Section title="Additional">
        <Row label="Occupation" value={farmer.primaryOccupation} />
        <Row label="Experience" value={farmer.farmingExperienceYears ? `${farmer.farmingExperienceYears} yrs` : null} />
        <Row label="Plantations" value={farmer.plantationCount ?? 0} />
      </Section>

      <Section title="Plantations">
        <TouchableOpacity
          style={styles.addPlantationBtn}
          onPress={() => navigation.navigate("PlantationForm", { farmerId: id })}
        >
          <Text style={styles.editBtnText}>+ Add Plantation</Text>
        </TouchableOpacity>
        <FlatList
          data={plantations}
          keyExtractor={(p) => p._id}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={styles.empty}>No plantations yet</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.plantCard} onPress={() => navigation.navigate("PlantationDetails", { id: item._id })}>
              <Text style={styles.plantName}>{item.plantationName}</Text>
              <Text style={styles.sub}>{item.plantationCode} · {item.area} {item.areaUnit}</Text>
            </TouchableOpacity>
          )}
        />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}
function Row({ label, value }) {
  return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value || "-"}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7f3" },
  name: { fontSize: 22, fontWeight: "700", color: "#1f2a1f" },
  sub: { fontSize: 13, color: "#667", marginTop: 2 },
  editBtn: { backgroundColor: "#2f6d3c", borderRadius: 8, padding: 10, alignItems: "center", marginTop: 12 },
  editBtnText: { color: "#fff", fontWeight: "700" },
  addPlantationBtn: { backgroundColor: "#5a9367", borderRadius: 8, padding: 10, alignItems: "center", marginBottom: 8 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#2f6d3c", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#eee" },
  rowLabel: { color: "#667" },
  rowValue: { fontWeight: "600" },
  plantCard: { backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 8 },
  plantName: { fontWeight: "700" },
  empty: { color: "#999", textAlign: "center", paddingVertical: 12 },
});
