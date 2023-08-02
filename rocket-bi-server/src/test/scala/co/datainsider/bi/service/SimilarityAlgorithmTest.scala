package co.datainsider.bi.service

import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.schema.module.MockSchemaClientModule
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.apache.commons.text.similarity.JaroWinklerSimilarity

class SimilarityAlgorithmTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(MockCaasClientModule, MockSchemaClientModule, TestModule, TestContainerModule).newInstance()

  test("String similarity algorithm test") {
    // Replace other algorithm into jaroWinklerAlgorithm to compare two jaroWinklerAlgorithm if finding better algorithm
    val jaroWinklerAlgorithm = new JaroWinklerSimilarity

    // string is lower and unsign.
    assert(jaroWinklerAlgorithm.apply("united_america", "united_state") > 0.8)
    assert(jaroWinklerAlgorithm.apply("united_of_america", "united_state") > 0.8)
    assert(jaroWinklerAlgorithm.apply("united", "united_state") > 0.8)
    assert(jaroWinklerAlgorithm.apply("newyork", "new_york") > 0.8)
    assert(jaroWinklerAlgorithm.apply("saint.petersburg", "st_petersburg") > 0.8)
    assert(jaroWinklerAlgorithm.apply("st.petersburg", "petersburg") > 0.8)
    assert(jaroWinklerAlgorithm.apply("st_petersburg", "petersburg") > 0.8)
    assert(jaroWinklerAlgorithm.apply("st.petersburg", "st_petersburg") > 0.8)
    assert(jaroWinklerAlgorithm.apply("ho_chi_minh_123", "ho_chi_minh") > 0.8)
    assert(jaroWinklerAlgorithm.apply("123_ho_chi_minh", "ho_chi_minh") > 0.8)
    assert(jaroWinklerAlgorithm.apply("ho_chi_123_minh", "ho_chi_minh") > 0.8)
    assert(jaroWinklerAlgorithm.apply("hochiminh", "ho_chi_minh") > 0.8)
    assert(jaroWinklerAlgorithm.apply("ho_chi_minh_123", "ho_chi_minh") > 0.8)
    assert(jaroWinklerAlgorithm.apply("ho_chi_minh", "ho_chi_minh") > 0.8)
    assert(jaroWinklerAlgorithm.apply("ho_chi_minh_city", "ho_chi_minh") > 0.8)
    assert(jaroWinklerAlgorithm.apply("ho_chi_minh_ci_ty", "ho_chi_minh") > 0.8)
    assert(jaroWinklerAlgorithm.apply("tp_ho_chi_minh", "ho_chi_minh") > 0.8)
    assert(jaroWinklerAlgorithm.apply("tphochiminh", "ho_chi_minh") > 0.8)
    assert(jaroWinklerAlgorithm.apply("bitcoin", "bcoin") > 0.8)
    assert(jaroWinklerAlgorithm.apply("korea_republic", "korea") > 0.8)
    assert(jaroWinklerAlgorithm.apply("russia_empire", "russia") > 0.8)
    assert(jaroWinklerAlgorithm.apply("united_state_of_america", "united_state") > 0.8)
    assert(jaroWinklerAlgorithm.apply("somali", "mali") > 0.8)
    assert(jaroWinklerAlgorithm.apply("win", "won") > 0.79)
    assert(jaroWinklerAlgorithm.apply("the_lord_of_the_rings", "thelordoftherings") > 0.8)
    assert(jaroWinklerAlgorithm.apply("sin_ga_po", "singapore") > 0.8)
    assert(jaroWinklerAlgorithm.apply("hcm_city", "hcm") > 0.8)
    assert(jaroWinklerAlgorithm.apply("ho_123_chi_minh", "ho_cho_minh") > 0.8)
    assert(jaroWinklerAlgorithm.apply("ho*chi*minh", "ho_cho_minh") > 0.8)
    assert(jaroWinklerAlgorithm.apply("ho_chi*minh", "ho_cho_minh") > 0.8)
    assert(jaroWinklerAlgorithm.apply("ho/chi!minh", "ho_cho_minh") > 0.8)
  }
}
